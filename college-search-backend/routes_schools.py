"""
API routes for schools-related endpoints
FIXED VERSION - Updated to match actual MongoDB structure
"""
from flask import Blueprint, request, jsonify
from models import SchoolModel, AcademicsProgramsModel, CostsAidCompletionModel
from bson import json_util
import json

schools_bp = Blueprint('schools', __name__, url_prefix='/api/schools')


def parse_json(data):
    """Helper to parse MongoDB ObjectId and other BSON types"""
    return json.loads(json_util.dumps(data))


def _merge_costs_into_basic_info(basic_info, costs):
    """
    Merge cost & outcomes fields from costs_aid_completion record into basic_info.latest
    FIXED to handle actual MongoDB structure
    """
    if not basic_info:
        return basic_info
    if not costs:
        return basic_info

    latest = basic_info.get('latest', {}) or {}

    # Handle earnings - check if exists in costs document
    if 'earnings' in costs:
        earnings_data = costs['earnings']
        if '10_yrs_after_entry' in earnings_data:
            latest['median_earnings_10yr'] = earnings_data['10_yrs_after_entry'].get('median')
        if '6_yrs_after_entry' in earnings_data:
            latest['median_earnings_6yr'] = earnings_data['6_yrs_after_entry'].get('median')
    
    # Handle median debt - nested structure
    if 'aid' in costs:
        aid_data = costs['aid']
        if 'median_debt' in aid_data:
            debt_data = aid_data['median_debt']
            if isinstance(debt_data, dict):
                if 'completers' in debt_data:
                    latest['median_debt'] = debt_data['completers'].get('overall')
                else:
                    # Might be directly under median_debt
                    latest['median_debt'] = debt_data.get('overall')
            else:
                # Simple number
                latest['median_debt'] = debt_data
        
        # Pell grant rate
        if 'pell_grant_rate' in aid_data:
            latest['pell_grant_rate'] = aid_data['pell_grant_rate']
        
        if 'federal_loan_rate' in aid_data:
            latest['federal_loan_rate'] = aid_data['federal_loan_rate']
    
    # Handle completion rates
    if 'completion' in costs:
        completion_data = costs['completion']
        if 'completion_rate_4yr_150nt' in completion_data:
            latest['completion_rate_4yr'] = completion_data['completion_rate_4yr_150nt']
        
        # Check for suppressed rates
        if 'rate_suppressed' in completion_data:
            suppressed = completion_data['rate_suppressed']
            if 'four_year' in suppressed:
                latest['completion_rate_overall'] = suppressed['four_year']
    
    # Handle default rate
    if 'repayment' in costs:
        repayment_data = costs['repayment']
        if '3_yr_default_rate' in repayment_data:
            latest['default_rate_3yr'] = repayment_data['3_yr_default_rate']
    
    # Handle cost - try multiple field paths
    if 'cost' in costs:
        cost_data = costs['cost']
        
        # Try to get avg_net_price
        if 'avg_net_price' in cost_data:
            avg_net_price_data = cost_data['avg_net_price']
            avg_net_price = (
                avg_net_price_data.get('overall') or
                avg_net_price_data.get('public') or
                avg_net_price_data.get('private')
            )
            if avg_net_price:
                latest['avg_net_price'] = avg_net_price
        
        # Tuition
        if 'tuition' in cost_data:
            tuition_data = cost_data['tuition']
            if 'in_state' in tuition_data:
                latest['tuition_in_state'] = tuition_data['in_state']
            if 'out_of_state' in tuition_data:
                latest['tuition_out_of_state'] = tuition_data['out_of_state']

    basic_info['latest'] = latest
    return basic_info


@schools_bp.route('/filter', methods=['GET', 'POST'])
def filter_schools():
    """Filter universities by cost, outcomes, location, major, etc."""
    try:
        # Get filters from query parameters or JSON body
        if request.method == 'POST':
            filters = request.get_json() or {}
        else:
            filters = {}
            
            # Parse query parameters
            if request.args.get('state'):
                filters['state'] = request.args.get('state')
            
            if request.args.get('ownership'):
                filters['ownership'] = int(request.args.get('ownership'))
            
            if request.args.get('sort_by'):
                filters['sort_by'] = request.args.get('sort_by')
            
            if request.args.get('sort_order'):
                filters['sort_order'] = request.args.get('sort_order')
        
        # Pagination
        page = int(request.args.get('page', filters.get('page', 1)))
        limit = min(int(request.args.get('limit', filters.get('limit', 20))), 100)
        skip = (page - 1) * limit
        
        # Check if major filter is requested
        major = request.args.get('major', filters.get('major'))
        
        if major:
            # First, find schools offering this major
            major_threshold = float(request.args.get('major_threshold', filters.get('major_threshold', 0.05)))
            schools_with_major = AcademicsProgramsModel.find_schools_with_major(major, major_threshold)
            school_ids = [s['school_id'] for s in schools_with_major]
            
            # Then apply other filters only to those schools
            filters['school_ids'] = school_ids
            
            # If no schools found with this major
            if not school_ids:
                return jsonify({
                    'results': [],
                    'total': 0,
                    'page': page,
                    'limit': limit,
                    'message': f'No schools found offering {major} program above {major_threshold*100}% threshold'
                }), 200
        
        # Get filtered results
        result = SchoolModel.filter_schools(filters, skip=skip, limit=limit)
        
        return jsonify({
            'results': parse_json(result['results']),
            'total': result['total'],
            'page': result['page'],
            'limit': result['limit']
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in filter_schools: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@schools_bp.route('/search', methods=['GET'])
def search_schools():
    """Search schools by name"""
    try:
        query = request.args.get('q', '')
        limit = min(int(request.args.get('limit', 20)), 100)
        
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        results = SchoolModel.search_by_name(query, limit=limit)
        
        return jsonify({
            'results': parse_json(results),
            'count': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@schools_bp.route('/compare', methods=['GET', 'POST'])
def compare_schools():
    """Compare multiple schools side by side"""
    try:
        if request.method == 'POST':
            data = request.get_json()
            school_ids = data.get('school_ids', [])
            year = data.get('year', 2023)
        else:
            school_ids_str = request.args.get('school_ids', '')
            school_ids = [int(id.strip()) for id in school_ids_str.split(',') if id.strip()]
            year = int(request.args.get('year', 2023))
        
        if not school_ids:
            return jsonify({'error': 'School IDs required'}), 400
        
        if len(school_ids) > 10:
            return jsonify({'error': 'Maximum 10 schools can be compared at once'}), 400
        
        # Get basic school info
        schools = SchoolModel.get_multiple_by_ids(school_ids)
        
        comparison_data = []
        for school_id in school_ids:
            school_info = next((s for s in schools if s['school_id'] == school_id), None)
            
            if not school_info:
                continue
            
            # Get additional data
            programs = AcademicsProgramsModel.find_by_school_and_year(school_id, year)
            costs_outcomes = CostsAidCompletionModel.find_by_school_and_year(school_id, year)

            # Merge cost/outcome fields into basic_info.latest
            merged_basic_info = _merge_costs_into_basic_info(school_info, costs_outcomes)

            comparison_data.append({
                'school_id': school_id,
                'basic_info': merged_basic_info,
                'programs': programs,
                'costs_outcomes': costs_outcomes
            })
        
        return jsonify({
            'schools': parse_json(comparison_data),
            'year': year
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in compare_schools: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@schools_bp.route('/<int:school_id>', methods=['GET'])
def get_school_details(school_id):
    """Get detailed information about a specific school"""
    try:
        year = int(request.args.get('year', 2023))
        include_history = request.args.get('include_history', 'false').lower() == 'true'
        
        # Get basic school info
        school = SchoolModel.find_by_id(school_id)
        
        if not school:
            return jsonify({'error': 'School not found'}), 404
        
        from models import (AcademicsProgramsModel, CostsAidCompletionModel, 
                           AdmissionsStudentModel, ProgramsFieldOfStudyModel)
        
        # Get current year data
        programs = AcademicsProgramsModel.find_by_school_and_year(school_id, year)
        costs_outcomes = CostsAidCompletionModel.find_by_school_and_year(school_id, year)
        admissions = AdmissionsStudentModel.find_by_school_and_year(school_id, year)
        field_of_study = ProgramsFieldOfStudyModel.get_programs_by_school(school_id, year)
        
        # Merge costs/outcomes into school basic info for convenience in UI
        merged_basic_info = _merge_costs_into_basic_info(school, costs_outcomes)

        result = {
            'school_id': school_id,
            'basic_info': merged_basic_info,
            'programs': programs,
            'costs_outcomes': costs_outcomes,
            'admissions': admissions,
            'field_of_study': field_of_study,
            'year': year
        }
        
        # Include historical data if requested
        if include_history:
            historical_data = CostsAidCompletionModel.get_historical_data(school_id, years=10)
            result['historical_data'] = historical_data
        
        return jsonify(parse_json(result)), 200
        
    except Exception as e:
        import traceback
        print(f"Error in get_school_details: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@schools_bp.route('/states', methods=['GET'])
def get_states():
    """Get list of all states with school counts"""
    try:
        pipeline = [
            {'$group': {
                '_id': '$school.state',
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        
        states = list(SchoolModel.get_collection().aggregate(pipeline))
        
        return jsonify({
            'states': parse_json(states)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@schools_bp.route('/debug/<int:school_id>', methods=['GET'])
def debug_school(school_id):
    """
    Debug endpoint to see raw data structure for a school
    Useful for troubleshooting field path issues
    """
    try:
        year = int(request.args.get('year', 2023))
        
        # Get all data for this school (debug endpoint - no projection to see full structure)
        school = SchoolModel.get_collection().find_one({'school_id': school_id})
        costs = CostsAidCompletionModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
        programs = AcademicsProgramsModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
        
        return jsonify({
            'school_id': school_id,
            'year': year,
            'raw_data': {
                'school': parse_json(school),
                'costs_aid_completion': parse_json(costs),
                'programs': parse_json(programs)
            }
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in debug_school: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500