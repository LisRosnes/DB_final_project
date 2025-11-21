"""
Data models for college search application
FIXED VERSION - Updated field paths to match actual MongoDB schema
"""
from database import get_collection
from bson import ObjectId


class SchoolModel:
    """Model for schools collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('schools')
    
    @staticmethod
    def find_by_id(school_id):
        """Find school by school_id"""
        return SchoolModel.get_collection().find_one({'school_id': school_id})
    
    @staticmethod
    def search_by_name(query, limit=20):
        """Search schools by name using text search"""
        return list(SchoolModel.get_collection().find(
            {'$text': {'$search': query}},
            {'score': {'$meta': 'textScore'}}
        ).sort([('score', {'$meta': 'textScore'})]).limit(limit))
    
    @staticmethod
    def filter_schools(filters, skip=0, limit=20):
        """
        Filter schools based on various criteria
        filters: dict with keys like state, cost_max, earnings_min, etc.
        
        FIXED: Updated field paths to match actual MongoDB structure
        """
        query = {}
        
        # State filter
        if filters.get('state'):
            query['school.state'] = filters['state']
        
        # Cost range filter - FIXED: correct nested path
        if filters.get('cost_min') is not None:
            query.setdefault('latest.cost.avg_net_price.overall', {})['$gte'] = filters['cost_min']
        if filters.get('cost_max') is not None:
            query.setdefault('latest.cost.avg_net_price.overall', {})['$lte'] = filters['cost_max']
        
        # Earnings filter - FIXED: correct nested path
        if filters.get('earnings_min') is not None:
            query['latest.earnings.10_yrs_after_entry.median'] = {'$gte': filters['earnings_min']}
        
        # Admission rate filter - FIXED: correct nested path
        if filters.get('admission_rate_max') is not None:
            query['latest.admissions.admission_rate.overall'] = {'$lte': filters['admission_rate_max']}
        
        # Completion rate filter - FIXED: correct nested path
        if filters.get('completion_rate_min') is not None:
            query['latest.completion.completion_rate_4yr_150nt'] = {'$gte': filters['completion_rate_min']}
        
        # Ownership filter (1=public, 2=private nonprofit, 3=private for-profit)
        if filters.get('ownership'):
            query['school.ownership'] = filters['ownership']
        
        # Size filter - FIXED: correct nested path
        if filters.get('size_min') is not None:
            query['latest.student.size'] = {'$gte': filters['size_min']}
        if filters.get('size_max') is not None:
            query.setdefault('latest.student.size', {})['$lte'] = filters['size_max']
        
        # Degree level filter
        if filters.get('degree_level'):
            query['school.degrees_awarded.predominant'] = filters['degree_level']
        
        # School IDs filter (for major filtering)
        if filters.get('school_ids'):
            query['school_id'] = {'$in': filters['school_ids']}
        
        # Sort options
        sort_field = filters.get('sort_by', 'school.name')
        sort_order = -1 if filters.get('sort_order') == 'desc' else 1
        
        total_count = SchoolModel.get_collection().count_documents(query)
        results = list(SchoolModel.get_collection().find(query)
                      .sort(sort_field, sort_order)
                      .skip(skip)
                      .limit(limit))
        
        return {
            'results': results,
            'total': total_count,
            'page': (skip // limit) + 1,
            'limit': limit
        }
    
    @staticmethod
    def get_multiple_by_ids(school_ids):
        """Get multiple schools by their IDs"""
        return list(SchoolModel.get_collection().find({'school_id': {'$in': school_ids}}))


class AcademicsProgramsModel:
    """Model for academics_programs collection"""
    
    @staticmethod
    def get_collection():
        return get_collection('academics_programs')
    
    @staticmethod
    def find_by_school_and_year(school_id, year=2024):
        """Get programs for a specific school and year"""
        return AcademicsProgramsModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
    
    @staticmethod
    def find_schools_with_major(major_field, threshold=0.05, year=2024):
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
    def find_by_school_and_year(school_id, year=2024):
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
                {'$match': {'school_info.school.state': state, 'year': 2024}},
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
                {'$match': {'year': 2024}},
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
    def get_program_trends(cip_code, start_year=2015, end_year=2024):
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
    def get_programs_by_school(school_id, year=2024):
        """Get all programs offered by a school"""
        return ProgramsFieldOfStudyModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
    
    @staticmethod
    def compare_programs_across_schools(cip_code, school_ids, year=2024):
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
    def find_by_school_and_year(school_id, year=2024):
        """Get admissions and student data for a specific school and year"""
        return AdmissionsStudentModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })