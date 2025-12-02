"""
Data models for college search application
"""
from database import get_collection
from bson import ObjectId

SORT_FIELD_MAP = {
    "size": "latest.student.size",
    "name": "school.name",
    "cost": "latest.cost.tuition.in_state",  # or avg_net_price if that's what you want
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
        """Normalizes the school document so frontend can reference common fields like
        `latest.avg_net_price`, `latest.admission_rate`, and `latest.student.size`.
        This helps keep the UI consistent regardless of whether data lives in
        `latest.cost.tuition` or `latest.cost.avg_net_price`.
        """
        if not doc:
            return doc

        latest = doc.get('latest', {}) or {}

        # avg_net_price fallback: prefer avg_net_price.overall, then tuition.in_state
        avg_net_price = None
        if 'cost' in latest:
            avg_net_price = latest.get('cost', {}).get('avg_net_price', {}).get('overall')
            if avg_net_price is None:
                # Use in_state tuition as a proxy
                avg_net_price = latest.get('cost', {}).get('tuition', {}).get('in_state')

        if avg_net_price is not None:
            latest['avg_net_price'] = avg_net_price

        # Admission rate quick property
        if latest.get('admissions') and latest['admissions'].get('admission_rate'):
            latest['admission_rate'] = latest['admissions']['admission_rate'].get('overall')

        # SAT/ACT quick properties
        if latest.get('admissions') and latest['admissions'].get('sat_scores'):
            latest['sat_avg'] = latest['admissions']['sat_scores'].get('average', {}).get('overall')
        if latest.get('admissions') and latest['admissions'].get('act_scores'):
            latest['act_avg'] = latest['admissions']['act_scores'].get('average', {}).get('overall')

        # Student size quick property
        if latest.get('student') and 'size' in latest['student']:
            latest['size'] = latest['student'].get('size')

        # Tuition quick properties
        if latest.get('cost') and latest['cost'].get('tuition'):
            latest['tuition_in_state'] = latest['cost']['tuition'].get('in_state')
            latest['tuition_out_of_state'] = latest['cost']['tuition'].get('out_of_state')

        # Completion rate quick properties
        if latest.get('completion'):
            if 'completion_rate_4yr_150nt' in latest['completion']:
                latest['completion_rate_4yr'] = latest['completion'].get('completion_rate_4yr_150nt')
            if 'completion_rate_overall' in latest['completion']:
                latest['completion_rate_overall'] = latest['completion'].get('completion_rate_overall')

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
        """
        Filter schools based on various criteria
        filters: dict with keys like state, cost_max, earnings_min, etc.
        
        FIXED: Updated to match ACTUAL MongoDB structure
        """
        query = {}
        
        # State filter
        if filters.get('state'):
            query['school.state'] = filters['state']
        
        # Cost range - use tuition.in_state by default, but also create a fallback $or to match
        # either avg_net_price or in/out-state tuition fields.
        # cost_min = filters.get('cost_min')
        # cost_max = filters.get('cost_max')
        # if cost_min is not None:
        #     # Using in_state tuition as a proxy for direct cost filters when present
        #     query.setdefault('latest.cost.tuition.in_state', {})['$gte'] = cost_min
        # if cost_max is not None:
        #     query.setdefault('latest.cost.tuition.in_state', {})['$lte'] = cost_max

        # if cost_min is not None or cost_max is not None:
        #     cost_candidates = ['latest.cost.avg_net_price.overall', 'latest.cost.tuition.in_state', 'latest.cost.tuition.out_of_state']
        #     cost_conditions = []
        #     for field in cost_candidates:
        #         cond = {}
        #         if cost_min is not None:
        #             cond['$gte'] = cost_min
        #         if cost_max is not None:
        #             cond['$lte'] = cost_max
        #         if cond:
        #             cost_conditions.append({field: cond})
        #     if cost_conditions:
        #         if len(cost_conditions) == 1:
        #             query.update(cost_conditions[0])
        #         else:
        #             query['$or'] = cost_conditions
        
        # REMOVED: Earnings filter - field doesn't exist in latest
        # You'll need to query costs_aid_completion collection for earnings data
        # if filters.get('earnings_min') is not None:
        #     query['latest.earnings.10_yrs_after_entry.median'] = {'$gte': filters['earnings_min']}
        
            # Earnings filter - some records may not include an earnings value in the 'latest' object.
            # Keeping the check, but note that earnings are often available in `costs_aid_completion` collection
            # or `programs_field_of_study`. This filter will only work if 'latest.earnings.10_yrs_after_entry.median'
            # exists on the document in `schools` collection.
        #     if filters.get('earnings_min') is not None:
        #         query['latest.earnings.10_yrs_after_entry.median'] = {'$gte': filters['earnings_min']}
        
        # # Admission rate filter - CORRECT
        # if filters.get('admission_rate_max') is not None:
        #     query['latest.admissions.admission_rate.overall'] = {'$lte': filters['admission_rate_max']}
        
        # # Completion rate filter - CORRECT
        # if filters.get('completion_rate_min') is not None:
        #     query['latest.completion.completion_rate_4yr_150nt'] = {'$gte': filters['completion_rate_min']}
        
        # Ownership filter (1=public, 2=private nonprofit, 3=private for-profit)
        if filters.get('ownership'):
            query['school.ownership'] = filters['ownership']
        
        # # Size filter - CORRECT
        # if filters.get('size_min') is not None:
        #     query['latest.student.size'] = {'$gte': filters['size_min']}
        # if filters.get('size_max') is not None:
        #     query.setdefault('latest.student.size', {})['$lte'] = filters['size_max']
        
        # Degree level filter
        if filters.get('degree_level'):
            query['school.degrees_awarded.predominant'] = filters['degree_level']
        
        # School IDs filter (for major filtering)
        if filters.get('school_ids'):
            query['school_id'] = {'$in': filters['school_ids']}
        
        sort_key = filters.get('sort_by', 'size')
        sort_field = SORT_FIELD_MAP.get(sort_key, "latest.student.size")
        sort_order = 1 if filters.get('sort_order') == 'asc' else -1

        print("DEBUG sort_key:", sort_key, "→ sort_field:", sort_field)

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


class AcademicsProgramsModel:
    """Model for academics_programs collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('academics_programs')
    
    @staticmethod
    def find_by_school_and_year(school_id, year=2020):
        """Get programs for a specific school and year"""
        return AcademicsProgramsModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
    
    @staticmethod
    def find_schools_with_major(major_field, threshold=0.05, year=2020):
        """
        Find schools offering a specific major above threshold
        major_field: e.g., 'computer', 'engineering', 'business_marketing'
        """
        query = {
            'year': year,
            f'academics.program_percentage.{major_field}': {'$gte': threshold}
        }
        return list(AcademicsProgramsModel.get_collection().find(
            query,
            {'school_id': 1, f'academics.program_percentage.{major_field}': 1}
        ))


class CostsAidCompletionModel:
    """Model for costs_aid_completion collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('costs_aid_completion')
    
    @staticmethod
    def find_by_school_and_year(school_id, year=2020):
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
    def get_state_aggregations(state=None):
        """Get aggregated statistics by state"""
        if state:
            # Need to lookup school data for state
            pipeline = [
                {'$lookup': {
                    'from': 'schools',
                    'localField': 'school_id',
                    'foreignField': 'school_id',
                    'as': 'school_info'
                }},
                {'$unwind': '$school_info'},
                {'$match': {'school_info.school.state': state, 'year': 2020}},
                {'$group': {
                    '_id': '$school_info.school.state',
                    'avg_cost': {'$avg': '$cost.avg_net_price.overall'},
                    'avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                    'avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'school_count': {'$sum': 1}
                }}
            ]
        else:
            pipeline = [
                {'$match': {'year': 2020}},
                {'$lookup': {
                    'from': 'schools',
                    'localField': 'school_id',
                    'foreignField': 'school_id',
                    'as': 'school_info'
                }},
                {'$unwind': '$school_info'},
                {'$group': {
                    '_id': '$school_info.school.state',
                    'avg_cost': {'$avg': '$cost.avg_net_price.overall'},
                    'avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                    'avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'school_count': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
        
        return list(CostsAidCompletionModel.get_collection().aggregate(pipeline))


class ProgramsFieldOfStudyModel:
    """Model for programs_field_of_study collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('programs_field_of_study')
    
    @staticmethod
    def get_program_trends(cip_code, start_year=2015, end_year=2020):
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
    def get_programs_by_school(school_id, year=2020):
        """Get all programs offered by a school"""
        return ProgramsFieldOfStudyModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
    
    @staticmethod
    def compare_programs_across_schools(cip_code, school_ids, year=2020):
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
    def find_by_school_and_year(school_id, year=2020):
        """Get admissions and student data for a specific school and year"""
        return AdmissionsStudentModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })