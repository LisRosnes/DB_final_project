"""
Data models for college search application
FIXED VERSION - Updated to match actual MongoDB structure
"""
from database import get_collection
from bson import ObjectId

SORT_FIELD_MAP = {
    "size": "latest.student.size",
    "name": "school.name",
    "cost": "latest.cost.tuition.in_state",
    "earnings": "latest.earnings.10_yrs_after_entry.median",
    "admission_rate": "latest.admissions.admission_rate.overall",
    "completion_rate": "latest.completion.completion_rate_4yr_150nt",
}


class SchoolModel:
    """Model for schools collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('schools')

    @staticmethod
    def _normalize_school_doc(doc):
        """Normalizes the school document for consistent frontend access"""
        if not doc:
            return doc

        latest = doc.get('latest', {}) or {}

        # Handle avg_net_price - check for private, public, or overall
        avg_net_price = None
        if 'cost' in latest:
            cost_data = latest.get('cost', {})
            avg_net_price_data = cost_data.get('avg_net_price', {})
            
            # Try different field names
            avg_net_price = (
                avg_net_price_data.get('overall') or
                avg_net_price_data.get('public') or
                avg_net_price_data.get('private') or
                cost_data.get('tuition', {}).get('in_state')
            )

        if avg_net_price is not None:
            latest['avg_net_price'] = avg_net_price

        # Admission rate
        if latest.get('admissions') and latest['admissions'].get('admission_rate'):
            latest['admission_rate'] = latest['admissions']['admission_rate'].get('overall')

        # SAT/ACT scores
        if latest.get('admissions') and latest['admissions'].get('sat_scores'):
            latest['sat_avg'] = latest['admissions']['sat_scores'].get('average', {}).get('overall')
        if latest.get('admissions') and latest['admissions'].get('act_scores'):
            latest['act_avg'] = latest['admissions']['act_scores'].get('midpoint', {}).get('cumulative')

        # Student size
        if latest.get('student') and 'size' in latest['student']:
            latest['size'] = latest['student'].get('size')

        # Tuition
        if latest.get('cost') and latest['cost'].get('tuition'):
            latest['tuition_in_state'] = latest['cost']['tuition'].get('in_state')
            latest['tuition_out_of_state'] = latest['cost']['tuition'].get('out_of_state')

        # Completion rates
        if latest.get('completion'):
            if 'completion_rate_4yr_150nt' in latest['completion']:
                latest['completion_rate_4yr'] = latest['completion'].get('completion_rate_4yr_150nt')
            if 'rate_suppressed' in latest['completion']:
                latest['completion_rate_overall'] = latest['completion']['rate_suppressed'].get('four_year')

        # Earnings
        if latest.get('earnings'):
            if '10_yrs_after_entry' in latest['earnings']:
                latest['median_earnings_10yr'] = latest['earnings']['10_yrs_after_entry'].get('median')
            if '6_yrs_after_entry' in latest['earnings']:
                latest['median_earnings_6yr'] = latest['earnings']['6_yrs_after_entry'].get('median')

        # Aid and debt
        if latest.get('aid'):
            latest['pell_grant_rate'] = latest['aid'].get('pell_grant_rate')
            if 'median_debt' in latest['aid']:
                debt_data = latest['aid']['median_debt']
                if isinstance(debt_data, dict) and 'completers' in debt_data:
                    latest['median_debt'] = debt_data.get('completers', {}).get('overall')
                else:
                    latest['median_debt'] = debt_data

        # Repayment
        if latest.get('repayment'):
            latest['default_rate_3yr'] = latest['repayment'].get('3_yr_default_rate')

        doc['latest'] = latest
        return doc
    
    @staticmethod
    def find_by_id(school_id):
        """Find school by school_id"""
        doc = SchoolModel.get_collection().find_one({'school_id': school_id})
        return SchoolModel._normalize_school_doc(doc)
    
    @staticmethod
    def search_by_name(query, limit=20):
        """Search schools by name using text search"""
        docs = list(SchoolModel.get_collection().find(
            {'$text': {'$search': query}},
            {'score': {'$meta': 'textScore'}}
        ).sort([('score', {'$meta': 'textScore'})]).limit(limit))
        return [SchoolModel._normalize_school_doc(d) for d in docs]

    @staticmethod
    def filter_schools(filters, skip=0, limit=20):
        """Filter schools based on various criteria"""
        query = {}
        
        # State filter
        if filters.get('state'):
            query['school.state'] = filters['state']
        
        # Ownership filter
        if filters.get('ownership'):
            query['school.ownership'] = filters['ownership']
        
        # Degree level filter
        if filters.get('degree_level'):
            query['school.degrees_awarded.predominant'] = filters['degree_level']
        
        # School IDs filter (for major filtering)
        if filters.get('school_ids'):
            query['school_id'] = {'$in': filters['school_ids']}
        
        sort_key = filters.get('sort_by', 'size')
        sort_field = SORT_FIELD_MAP.get(sort_key, "latest.student.size")
        sort_order = 1 if filters.get('sort_order') == 'asc' else -1

        total_count = SchoolModel.get_collection().count_documents(query)

        results = list(
            SchoolModel.get_collection()
                .find(query)
                .sort(sort_field, sort_order)
                .skip(skip)
                .limit(limit)
        )

        results = [SchoolModel._normalize_school_doc(r) for r in results]

        return {
            'results': results,
            'total': total_count,
            'page': (skip // limit) + 1,
            'limit': limit
        }
    
    @staticmethod
    def get_multiple_by_ids(school_ids):
        """Get multiple schools by their IDs"""
        docs = list(SchoolModel.get_collection().find({'school_id': {'$in': school_ids}}))
        return [SchoolModel._normalize_school_doc(d) for d in docs]


class CostsAidCompletionModel:
    """Model for costs_aid_completion collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('costs_aid_completion')
    
    @staticmethod
    def find_by_school_and_year(school_id, year=2023):
        """Get cost, aid, and completion data for a specific school and year"""
        return CostsAidCompletionModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
    
    @staticmethod
    def get_historical_data(school_id, years=5):
        """Get historical data for trends"""
        return list(CostsAidCompletionModel.get_collection().find({
            'school_id': school_id
        }).sort('year', -1).limit(years))
    
    @staticmethod
    def get_cost_field_expr():
        """
        Returns a MongoDB expression to extract cost, trying multiple field paths.
        Use this in aggregation pipelines.
        """
        return {
            '$ifNull': [
                '$cost.avg_net_price.overall',
                {
                    '$ifNull': [
                        '$cost.avg_net_price.public',
                        {
                            '$ifNull': [
                                '$cost.avg_net_price.private',
                                '$cost.tuition.in_state'
                            ]
                        }
                    ]
                }
            ]
        }
    
    @staticmethod
    def get_state_aggregations(state=None):
        """Get aggregated statistics by state"""
        if state:
            pipeline = [
                {'$lookup': {
                    'from': 'schools',
                    'localField': 'school_id',
                    'foreignField': 'school_id',
                    'as': 'school_info'
                }},
                {'$unwind': '$school_info'},
                {'$match': {'school_info.school.state': state, 'year': 2023}},
                {'$group': {
                    '_id': '$school_info.school.state',
                    'avg_cost': {'$avg': CostsAidCompletionModel.get_cost_field_expr()},
                    'avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                    'avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'school_count': {'$sum': 1}
                }}
            ]
        else:
            pipeline = [
                {'$match': {'year': 2023}},
                {'$lookup': {
                    'from': 'schools',
                    'localField': 'school_id',
                    'foreignField': 'school_id',
                    'as': 'school_info'
                }},
                {'$unwind': '$school_info'},
                {'$group': {
                    '_id': '$school_info.school.state',
                    'avg_cost': {'$avg': CostsAidCompletionModel.get_cost_field_expr()},
                    'avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                    'avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'school_count': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
        
        return list(CostsAidCompletionModel.get_collection().aggregate(pipeline))


class AcademicsProgramsModel:
    """Model for academics_programs collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('academics_programs')
    
    @staticmethod
    def find_by_school_and_year(school_id, year=2023):
        """Get programs for a specific school and year"""
        return AcademicsProgramsModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
    
    @staticmethod
    def find_schools_with_major(major_field, threshold=0.05, year=2023):
        """Find schools offering a specific major above threshold"""
        query = {
            'year': year,
            f'academics.program_percentage.{major_field}': {'$gte': threshold}
        }
        return list(AcademicsProgramsModel.get_collection().find(
            query,
            {'school_id': 1, f'academics.program_percentage.{major_field}': 1}
        ))


class ProgramsFieldOfStudyModel:
    """Model for programs_field_of_study collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('programs_field_of_study')
    
    @staticmethod
    def get_program_trends(cip_code, start_year=2015, end_year=2023):
        """Get earnings trends for a specific program over years"""
        pipeline = [
            {'$match': {
                'year': {'$gte': start_year, '$lte': end_year}
            }},
            {'$unwind': '$programs'},
            {'$match': {'programs.cip_code': cip_code}},
            {'$group': {
                '_id': '$year',
                'avg_1yr_earnings': {'$avg': '$programs.earnings.1_yr_after.median'},
                'avg_3yr_earnings': {'$avg': '$programs.earnings.3_yrs_after.median'},
                'avg_5yr_earnings': {'$avg': '$programs.earnings.5_yrs_after.median'},
                'avg_debt': {'$avg': '$programs.debt.median'},
                'school_count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        
        return list(ProgramsFieldOfStudyModel.get_collection().aggregate(pipeline))
    
    @staticmethod
    def get_programs_by_school(school_id, year=2023):
        """Get all programs offered by a school"""
        return ProgramsFieldOfStudyModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
    
    @staticmethod
    def compare_programs_across_schools(cip_code, school_ids, year=2023):
        """Compare a specific program across multiple schools"""
        pipeline = [
            {'$match': {
                'school_id': {'$in': school_ids},
                'year': year
            }},
            {'$unwind': '$programs'},
            {'$match': {'programs.cip_code': cip_code}},
            {'$project': {
                'school_id': 1,
                'year': 1,
                'program': '$programs'
            }}
        ]
        
        return list(ProgramsFieldOfStudyModel.get_collection().aggregate(pipeline))


class AdmissionsStudentModel:
    """Model for admissions_student collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('admissions_student')
    
    @staticmethod
    def find_by_school_and_year(school_id, year=2023):
        """Get admissions and student data for a specific school and year"""
        return AdmissionsStudentModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })