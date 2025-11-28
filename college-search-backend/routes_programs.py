"""
API routes for programs and visualization endpoints
"""
from flask import Blueprint, request, jsonify
from models import ProgramsFieldOfStudyModel, AcademicsProgramsModel
from bson import json_util
import json

programs_bp = Blueprint('programs', __name__, url_prefix='/api/programs')


def parse_json(data):
    """Helper to parse MongoDB ObjectId and other BSON types"""
    return json.loads(json_util.dumps(data))


@programs_bp.route('/trends', methods=['GET'])
def get_program_trends():
    """
    Get ROI and salary trends by field of study
    
    Query parameters:
    - cip_code: 4-digit CIP code (e.g., '1102' for Computer Science)
    - start_year: Start year for trend (default 2015)
    - end_year: End year for trend (default 2024)
    """
    try:
        cip_code = request.args.get('cip_code')
        
        if not cip_code:
            return jsonify({'error': 'CIP code required'}), 400
        
        start_year = int(request.args.get('start_year', 2015))
        end_year = int(request.args.get('end_year', 2024))
        
        trends = ProgramsFieldOfStudyModel.get_program_trends(cip_code, start_year, end_year)
        
        return jsonify({
            'cip_code': cip_code,
            'trends': parse_json(trends),
            'years': f'{start_year}-{end_year}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@programs_bp.route('/compare', methods=['POST'])
def compare_programs():
    """
    Compare a specific program across multiple schools
    
    JSON body:
    - cip_code: 4-digit CIP code
    - school_ids: Array of school IDs
    - year: Year for comparison (default 2024)
    """
    try:
        data = request.get_json()
        
        cip_code = data.get('cip_code')
        school_ids = data.get('school_ids', [])
        year = data.get('year', 2024)
        
        if not cip_code or not school_ids:
            return jsonify({'error': 'CIP code and school IDs required'}), 400
        
        if len(school_ids) > 20:
            return jsonify({'error': 'Maximum 20 schools can be compared'}), 400
        
        comparison = ProgramsFieldOfStudyModel.compare_programs_across_schools(
            cip_code, school_ids, year
        )
        
        return jsonify({
            'cip_code': cip_code,
            'comparison': parse_json(comparison),
            'year': year
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@programs_bp.route('/majors', methods=['GET'])
def get_available_majors():
    """
    Get list of available majors/programs
    
    Query parameters:
    - year: Year to check (default 2024)
    """
    try:
        year = int(request.args.get('year', 2024))
        
        # Get all unique program fields that have non-zero percentages
        pipeline = [
            {'$match': {'year': year}},
            {'$limit': 1},
            {'$project': {'program_percentage': 1}}
        ]
        
        sample = list(AcademicsProgramsModel.get_collection().aggregate(pipeline))
        
        if sample:
            majors = list(sample[0].get('program_percentage', {}).keys())
            
            # Create friendly names
            major_mapping = {
                'agriculture': 'Agriculture',
                'resources': 'Natural Resources',
                'architecture': 'Architecture',
                'ethnic_cultural_gender': 'Ethnic, Cultural & Gender Studies',
                'communication': 'Communication',
                'communications_technology': 'Communications Technology',
                'computer': 'Computer Science',
                'personal_culinary': 'Personal & Culinary Services',
                'education': 'Education',
                'engineering': 'Engineering',
                'engineering_technology': 'Engineering Technology',
                'language': 'Foreign Languages',
                'family_consumer_science': 'Family & Consumer Sciences',
                'legal': 'Legal Studies',
                'english': 'English',
                'humanities': 'Liberal Arts & Humanities',
                'library': 'Library Science',
                'biological': 'Biological Sciences',
                'mathematics': 'Mathematics',
                'military': 'Military Science',
                'multidiscipline': 'Multidisciplinary Studies',
                'parks_recreation_fitness': 'Parks, Recreation & Fitness',
                'philosophy_religious': 'Philosophy & Religious Studies',
                'theology_religious_vocation': 'Theology & Religious Vocations',
                'physical_science': 'Physical Sciences',
                'science_technology': 'Science Technology',
                'psychology': 'Psychology',
                'security_law_enforcement': 'Security & Law Enforcement',
                'public_administration_social_service': 'Public Administration',
                'social_science': 'Social Sciences',
                'construction': 'Construction Trades',
                'mechanic_repair_technology': 'Mechanic & Repair Technology',
                'precision_production': 'Precision Production',
                'transportation': 'Transportation',
                'visual_performing': 'Visual & Performing Arts',
                'health': 'Health Professions',
                'business_marketing': 'Business & Marketing',
                'history': 'History'
            }
            
            majors_list = [
                {
                    'field_code': major,
                    'field_name': major_mapping.get(major, major.replace('_', ' ').title())
                }
                for major in majors
            ]
            
            return jsonify({
                'majors': majors_list,
                'count': len(majors_list)
            }), 200
        else:
            return jsonify({'majors': [], 'count': 0}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@programs_bp.route('/cip-codes', methods=['GET'])
def get_cip_codes():
    """
    Get list of common CIP codes with descriptions
    """
    try:
        # Common CIP codes for reference
        common_cip_codes = [
            {'code': '1102', 'title': 'Computer and Information Sciences', 'family': '11'},
            {'code': '1401', 'title': 'Engineering, General', 'family': '14'},
            {'code': '1407', 'title': 'Chemical Engineering', 'family': '14'},
            {'code': '1408', 'title': 'Civil Engineering', 'family': '14'},
            {'code': '1409', 'title': 'Computer Engineering', 'family': '14'},
            {'code': '1410', 'title': 'Electrical Engineering', 'family': '14'},
            {'code': '1419', 'title': 'Mechanical Engineering', 'family': '14'},
            {'code': '2601', 'title': 'Biology/Biological Sciences', 'family': '26'},
            {'code': '2701', 'title': 'Mathematics', 'family': '27'},
            {'code': '4005', 'title': 'Physical Sciences', 'family': '40'},
            {'code': '4201', 'title': 'Psychology', 'family': '42'},
            {'code': '4501', 'title': 'Social Sciences', 'family': '45'},
            {'code': '5001', 'title': 'Visual and Performing Arts', 'family': '50'},
            {'code': '5102', 'title': 'Health Professions', 'family': '51'},
            {'code': '5201', 'title': 'Business Administration', 'family': '52'},
            {'code': '5401', 'title': 'History', 'family': '54'},
        ]
        
        return jsonify({
            'cip_codes': common_cip_codes,
            'count': len(common_cip_codes)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@programs_bp.route('/school/<int:school_id>', methods=['GET'])
def get_school_programs(school_id):
    """
    Get all programs offered by a specific school
    
    Path parameter:
    - school_id: School ID
    
    Query parameters:
    - year: Year (default 2024)
    """
    try:
        year = int(request.args.get('year', 2024))
        
        programs = AcademicsProgramsModel.find_by_school_and_year(school_id, year)
        field_of_study = ProgramsFieldOfStudyModel.get_programs_by_school(school_id, year)
        
        if not programs:
            return jsonify({'error': 'No programs found for this school'}), 404
        
        return jsonify({
            'school_id': school_id,
            'year': year,
            'program_percentages': parse_json(programs.get('program_percentage', {})),
            'program_details': parse_json(programs.get('program', {})),
            'field_of_study_data': parse_json(field_of_study.get('programs', []) if field_of_study else [])
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
