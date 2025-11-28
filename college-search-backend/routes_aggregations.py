"""
API routes for aggregations, analytics, and geographic visualizations
FIXED VERSION - Updated field paths to match actual MongoDB schema
"""
from flask import Blueprint, request, jsonify
from models import CostsAidCompletionModel, SchoolModel
from bson import json_util
import json

aggregations_bp = Blueprint('aggregations', __name__, url_prefix='/api/aggregations')


def parse_json(data):
    """Helper to parse MongoDB ObjectId and other BSON types"""
    return json.loads(json_util.dumps(data))


@aggregations_bp.route('/state', methods=['GET'])
def get_state_aggregations():
    """
    Get state-level statistics for geographic visualization
    
    Query parameters:
    - state: Specific state code (optional, returns all if not specified)
    """
    try:
        state = request.args.get('state')
        
        aggregations = CostsAidCompletionModel.get_state_aggregations(state)
        
        return jsonify({
            'state': state or 'all',
            'aggregations': parse_json(aggregations)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@aggregations_bp.route('/roi', methods=['GET'])
def calculate_roi():
    """
    Calculate ROI (Return on Investment) metrics
    
    Query parameters:
    - state: Filter by state (optional)
    - ownership: Filter by ownership type (optional)
    - major: Filter by major field (optional)
    - year: Year for data (default 2024)
    """
    try:
        state = request.args.get('state')
        ownership = request.args.get('ownership')
        major = request.args.get('major')
        year = int(request.args.get('year', 2024))
        
        # Build match conditions
        match_conditions = {'year': year}
        
        pipeline = [
            {'$match': match_conditions}
        ]
        
        # Add school info lookup
        pipeline.append({
            '$lookup': {
                'from': 'schools',
                'localField': 'school_id',
                'foreignField': 'school_id',
                'as': 'school_info'
            }
        })
        
        pipeline.append({'$unwind': '$school_info'})
        
        # Apply filters
        school_filters = {}
        if state:
            school_filters['school_info.school.state'] = state
        if ownership:
            school_filters['school_info.school.ownership'] = int(ownership)
        
        if school_filters:
            pipeline.append({'$match': school_filters})
        
        # If major filter is specified, also lookup academics
        if major:
            pipeline.extend([
                {
                    '$lookup': {
                        'from': 'academics_programs',
                        'localField': 'school_id',
                        'foreignField': 'school_id',
                        'as': 'academics'
                    }
                },
                {'$unwind': '$academics'},
                {'$match': {
                    'academics.year': year,
                    f'academics.academics.program_percentage.{major}': {'$gte': 0.05}
                }}
            ])
        
        # Calculate ROI metrics
        pipeline.extend([
            {
                '$project': {
                    'school_id': 1,
                    'school_name': '$school_info.school.name',
                    'state': '$school_info.school.state',
                    'cost': '$cost.avg_net_price.overall',
                    'earnings_6yr': '$earnings.6_yrs_after_entry.median',
                    'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                    'completion_rate': '$completion.completion_rate_4yr_150nt',
                    'median_debt': '$aid.median_debt.completers.overall',
                    # Calculate simple ROI: (10yr earnings - cost) / cost
                    'roi_10yr': {
                        '$cond': {
                            'if': {'$and': [
                                {'$gt': ['$earnings.10_yrs_after_entry.median', 0]},
                                {'$gt': ['$cost.avg_net_price.overall', 0]}
                            ]},
                            'then': {
                                '$divide': [
                                    {'$subtract': [
                                        {'$multiply': ['$earnings.10_yrs_after_entry.median', 10]},
                                        {'$multiply': ['$cost.avg_net_price.overall', 4]}
                                    ]},
                                    {'$multiply': ['$cost.avg_net_price.overall', 4]}
                                ]
                            },
                            'else': None
                        }
                    }
                }
            },
            {'$match': {
                'cost': {'$ne': None, '$gt': 0},
                'earnings_10yr': {'$ne': None, '$gt': 0}
            }},
            {'$sort': {'roi_10yr': -1}},
            {'$limit': 100}
        ])
        
        results = list(CostsAidCompletionModel.get_collection().aggregate(pipeline))
        
        return jsonify({
            'roi_data': parse_json(results),
            'count': len(results),
            'filters': {
                'state': state,
                'ownership': ownership,
                'major': major,
                'year': year
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@aggregations_bp.route('/earnings-distribution', methods=['GET'])
def get_earnings_distribution():
    """
    Get earnings distribution across schools
    
    Query parameters:
    - year: Year for data (default 2024)
    - major: Filter by major (optional)
    - state: Filter by state (optional)
    """
    try:
        year = int(request.args.get('year', 2024))
        major = request.args.get('major')
        state = request.args.get('state')
        
        pipeline = [
            {'$match': {'year': year}},
            {
                '$lookup': {
                    'from': 'schools',
                    'localField': 'school_id',
                    'foreignField': 'school_id',
                    'as': 'school_info'
                }
            },
            {'$unwind': '$school_info'}
        ]
        
        # Apply filters
        filters = {}
        if state:
            filters['school_info.school.state'] = state
        
        if filters:
            pipeline.append({'$match': filters})
        
        # If major filter
        if major:
            pipeline.extend([
                {
                    '$lookup': {
                        'from': 'academics_programs',
                        'localField': 'school_id',
                        'foreignField': 'school_id',
                        'as': 'academics'
                    }
                },
                {'$unwind': '$academics'},
                {'$match': {
                    'academics.year': year,
                    f'academics.academics.program_percentage.{major}': {'$gte': 0.05}
                }}
            ])
        
        # Group into earnings buckets
        pipeline.extend([
            {
                '$bucket': {
                    'groupBy': '$earnings.10_yrs_after_entry.median',
                    'boundaries': [0, 30000, 40000, 50000, 60000, 70000, 80000, 100000, 150000, 200000, 500000],
                    'default': 'other',
                    'output': {
                        'count': {'$sum': 1},
                        'schools': {
                            '$push': {
                                'school_id': '$school_id',
                                'name': '$school_info.school.name',
                                'earnings': '$earnings.10_yrs_after_entry.median'
                            }
                        }
                    }
                }
            }
        ])
        
        distribution = list(CostsAidCompletionModel.get_collection().aggregate(pipeline))
        
        return jsonify({
            'distribution': parse_json(distribution),
            'year': year,
            'filters': {
                'major': major,
                'state': state
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@aggregations_bp.route('/cost-vs-earnings', methods=['GET'])
def get_cost_vs_earnings():
    """
    Get cost vs earnings scatter plot data
    
    Query parameters:
    - year: Year for data (default 2024)
    - state: Filter by state (optional)
    - ownership: Filter by ownership (optional)
    - limit: Max results (default 200)
    """
    try:
        year = int(request.args.get('year', 2024))
        state = request.args.get('state')
        ownership = request.args.get('ownership')
        limit = min(int(request.args.get('limit', 200)), 500)
        
        pipeline = [
            {'$match': {'year': year}},
            {
                '$lookup': {
                    'from': 'schools',
                    'localField': 'school_id',
                    'foreignField': 'school_id',
                    'as': 'school_info'
                }
            },
            {'$unwind': '$school_info'}
        ]
        
        # Apply filters
        filters = {}
        if state:
            filters['school_info.school.state'] = state
        if ownership:
            filters['school_info.school.ownership'] = int(ownership)
        
        if filters:
            pipeline.append({'$match': filters})
        
        pipeline.extend([
            {
                '$match': {
                    'cost.avg_net_price.overall': {'$ne': None, '$gt': 0},
                    'earnings.10_yrs_after_entry.median': {'$ne': None, '$gt': 0}
                }
            },
            {
                '$project': {
                    'school_id': 1,
                    'school_name': '$school_info.school.name',
                    'state': '$school_info.school.state',
                    'ownership': '$school_info.school.ownership',
                    'cost': '$cost.avg_net_price.overall',
                    'earnings': '$earnings.10_yrs_after_entry.median',
                    'completion_rate': '$completion.completion_rate_4yr_150nt',
                    # FIXED: Get size from school_info.latest if available
                    'size': {
                        '$ifNull': [
                            '$school_info.latest.student.size',
                            '$school_info.latest.size'
                        ]
                    }
                }
            },
            {'$limit': limit}
        ])
        
        data = list(CostsAidCompletionModel.get_collection().aggregate(pipeline))
        
        return jsonify({
            'data': parse_json(data),
            'count': len(data),
            'year': year
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@aggregations_bp.route('/completion-rates', methods=['GET'])
def get_completion_rates():
    """
    Get completion rate statistics
    
    Query parameters:
    - group_by: 'state', 'ownership', or 'degree_level' (default 'state')
    - year: Year for data (default 2024)
    """
    try:
        group_by = request.args.get('group_by', 'state')
        year = int(request.args.get('year', 2024))
        
        # Map group_by to field path
        group_field_map = {
            'state': '$school_info.school.state',
            'ownership': '$school_info.school.ownership',
            'degree_level': '$school_info.school.degrees_awarded.predominant'
        }
        
        if group_by not in group_field_map:
            return jsonify({'error': 'Invalid group_by parameter'}), 400
        
        pipeline = [
            {'$match': {'year': year}},
            {
                '$lookup': {
                    'from': 'schools',
                    'localField': 'school_id',
                    'foreignField': 'school_id',
                    'as': 'school_info'
                }
            },
            {'$unwind': '$school_info'},
            {
                '$group': {
                    '_id': group_field_map[group_by],
                    'avg_completion_4yr': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'avg_completion_overall': {
                        '$avg': {
                            '$ifNull': [
                                '$completion.completion_rate_overall',
                                '$completion.completion_rate_4yr_150nt'
                            ]
                        }
                    },
                    'school_count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        results = list(CostsAidCompletionModel.get_collection().aggregate(pipeline))
        
        return jsonify({
            'data': parse_json(results),
            'group_by': group_by,
            'year': year
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500