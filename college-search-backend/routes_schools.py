"""
API routes for schools-related endpoints
"""
from flask import Blueprint, request, jsonify
from models import SchoolModel, AcademicsProgramsModel
from models import CostsAidCompletionModel
from bson import json_util
import json

schools_bp = Blueprint('schools', __name__, url_prefix='/api/schools')


def parse_json(data):
    """Helper to parse MongoDB ObjectId and other BSON types"""
    return json.loads(json_util.dumps(data))


def _merge_costs_into_basic_info(basic_info, costs):
    """Merge cost & outcomes fields from `costs_aid_completion` record into the
    `basic_info.latest` object so the frontend can read a consistent set of fields
    (median earnings, median debt, default rate, completion rates, pell rate).
    """
    if not basic_info:
        return basic_info
    if not costs:
        return basic_info

    latest = basic_info.get('latest', {}) or {}

    latest['median_earnings_10yr'] = costs.get('earnings', {}).get('10_yrs_after_entry', {}).get('median')
    # Optional fields if present
    latest['median_earnings_6yr'] = costs.get('earnings', {}).get('6_yrs_after_entry', {}).get('median')
    latest['median_debt'] = costs.get('debt', {}).get('median') if costs.get('debt') else latest.get('median_debt')
    latest['completion_rate_4yr'] = costs.get('completion', {}).get('completion_rate_4yr_150nt')
    latest['completion_rate_overall'] = costs.get('completion', {}).get('completion_rate_overall')
    latest['default_rate_3yr'] = costs.get('repayment', {}).get('3_yr_default_rate')
    latest['pell_grant_rate'] = costs.get('aid', {}).get('pell_grant_rate') or latest.get('pell_grant_rate')

    basic_info['latest'] = latest
    return basic_info


@schools_bp.route('/filter', methods=['GET', 'POST'])
def filter_schools():
    """
    Filter universities by cost, outcomes, location, major, etc.
    
    Query parameters:
    - state: State abbreviation (e.g., 'CA', 'NY')
    - cost_min: Minimum cost (tuition in-state or avg net price fallback)
    - cost_max: Maximum cost (tuition in-state or avg net price fallback)
    - earnings_min: Minimum median earnings (10 years after entry)
    - admission_rate_max: Maximum admission rate
    - completion_rate_min: Minimum completion rate
    - ownership: 1=public, 2=private nonprofit, 3=private for-profit
    - size_min: Minimum student size
    - size_max: Maximum student size
    - degree_level: 1=certificate, 2=associate, 3=bachelor, 4=graduate
    - major: Major field (e.g., 'computer', 'engineering', 'business_marketing')
    - major_threshold: Minimum percentage for major filter (default 0.05)
    - page: Page number (default 1)
    - limit: Results per page (default 20, max 100)
        - sort_by: Field to sort by (default 'school.name')
            Common options: 'school.name', 'latest.avg_net_price', 'latest.size', 'latest.admission_rate'
    - sort_order: 'asc' or 'desc' (default 'asc')
    """
    try:
        # Get filters from query parameters or JSON body
        if request.method == 'POST':
            filters = request.get_json() or {}
        else:
            filters = {}
            
            # Parse query parameters
            if request.args.get('state'):
                filters['state'] = request.args.get('state')
            
            if request.args.get('cost_min'):
                filters['cost_min'] = float(request.args.get('cost_min'))
            
            if request.args.get('cost_max'):
                filters['cost_max'] = float(request.args.get('cost_max'))
            
            if request.args.get('earnings_min'):
                filters['earnings_min'] = float(request.args.get('earnings_min'))
            
            if request.args.get('admission_rate_max'):
                filters['admission_rate_max'] = float(request.args.get('admission_rate_max'))
            
            if request.args.get('completion_rate_min'):
                filters['completion_rate_min'] = float(request.args.get('completion_rate_min'))
            
            if request.args.get('ownership'):
                filters['ownership'] = int(request.args.get('ownership'))
            
            if request.args.get('size_min'):
                filters['size_min'] = int(request.args.get('size_min'))
            
            if request.args.get('size_max'):
                filters['size_max'] = int(request.args.get('size_max'))
            
            if request.args.get('degree_level'):
                filters['degree_level'] = int(request.args.get('degree_level'))
            
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
        return jsonify({'error': str(e)}), 500


@schools_bp.route('/search', methods=['GET'])
def search_schools():
    """
    Search schools by name
    
    Query parameters:
    - q: Search query
    - limit: Maximum results (default 20)
    """
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
    """
    Compare multiple schools side by side
    
    Query parameters or JSON body:
    - school_ids: Comma-separated list of school IDs or array in JSON
    - year: Year for data (default 2024)
    """
    try:
        if request.method == 'POST':
            data = request.get_json()
            school_ids = data.get('school_ids', [])
            year = data.get('year', 2024)
        else:
            school_ids_str = request.args.get('school_ids', '')
            school_ids = [int(id.strip()) for id in school_ids_str.split(',') if id.strip()]
            year = int(request.args.get('year', 2024))
        
        if not school_ids:
            return jsonify({'error': 'School IDs required'}), 400
        
        if len(school_ids) > 10:
            return jsonify({'error': 'Maximum 10 schools can be compared at once'}), 400
        
        # Get basic school info
        schools = SchoolModel.get_multiple_by_ids(school_ids)
        
        # Get programs data
        from models import AcademicsProgramsModel, CostsAidCompletionModel
        
        comparison_data = []
        for school_id in school_ids:
            school_info = next((s for s in schools if s['school_id'] == school_id), None)
            
            if not school_info:
                continue
            
            # Get additional data
            programs = AcademicsProgramsModel.find_by_school_and_year(school_id, year)
            costs_outcomes = CostsAidCompletionModel.find_by_school_and_year(school_id, year)

            # Merge cost/outcome fields into basic_info.latest so UI can access them under basic_info.latest
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
        return jsonify({'error': str(e)}), 500


@schools_bp.route('/<int:school_id>', methods=['GET'])
def get_school_details(school_id):
    """
    Get detailed information about a specific school
    
    Path parameter:
    - school_id: School ID (UNITID)
    
    Query parameters:
    - year: Year for detailed data (default 2024)
    - include_history: Include historical data (default false)
    """
    try:
        year = int(request.args.get('year', 2024))
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
