"""
API routes for aggregations, analytics, and geographic visualizations
FIXED VERSION - Updated to match actual MongoDB structure
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
    """Get state-level statistics for geographic visualization"""
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
    - year: Year for data (default 2023)
    """
    try:
        state = request.args.get('state')
        ownership = request.args.get('ownership')
        major = request.args.get('major')
        year = int(request.args.get('year', 2023))
        
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
        
        # Calculate ROI metrics - using flexible cost field access
        cost_expr = CostsAidCompletionModel.get_cost_field_expr()
        
        pipeline.extend([
            {
                '$project': {
                    'school_id': 1,
                    'school_name': '$school_info.school.name',
                    'state': '$school_info.school.state',
                    'ownership': '$school_info.school.ownership',
                    'cost': cost_expr,
                    'earnings_6yr': '$earnings.6_yrs_after_entry.median',
                    'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                    'completion_rate': '$completion.completion_rate_4yr_150nt',
                    'median_debt': {
                        '$ifNull': [
                            '$aid.median_debt.completers.overall',
                            '$aid.median_debt'
                        ]
                    },
                    # ROI = (10yr earnings * 10 - 4 * cost) / (4 * cost)
                    'roi_10yr': {
                        '$cond': {
                            'if': {
                                '$and': [
                                    {'$gt': ['$earnings.10_yrs_after_entry.median', 0]},
                                    {'$gt': [cost_expr, 0]}
                                ]
                            },
                            'then': {
                                '$divide': [
                                    {
                                        '$subtract': [
                                            {'$multiply': ['$earnings.10_yrs_after_entry.median', 10]},
                                            {'$multiply': [cost_expr, 4]}
                                        ]
                                    },
                                    {'$multiply': [cost_expr, 4]}
                                ]
                            },
                            'else': None
                        }
                    },
                    # Simple payback period: (4 * cost) / annual_earnings
                    'payback_years': {
                        '$cond': {
                            'if': {
                                '$and': [
                                    {'$gt': ['$earnings.10_yrs_after_entry.median', 0]},
                                    {'$gt': [cost_expr, 0]}
                                ]
                            },
                            'then': {
                                '$divide': [
                                    {'$multiply': [cost_expr, 4]},
                                    '$earnings.10_yrs_after_entry.median'
                                ]
                            },
                            'else': None
                        }
                    }
                }
            },
            # Filter out records with missing data
            {
                '$match': {
                    'cost': {'$ne': None, '$gt': 0},
                    'earnings_10yr': {'$ne': None, '$gt': 0},
                    'roi_10yr': {'$ne': None}
                }
            },
            # Final projection
            {
                '$project': {
                    'school_id': 1,
                    'school_name': 1,
                    'state': 1,
                    'ownership': 1,
                    'cost': {'$round': ['$cost', 0]},
                    'earnings_10yr': {'$round': ['$earnings_10yr', 0]},
                    'completion_rate': {'$round': ['$completion_rate', 4]},
                    'median_debt': {'$round': ['$median_debt', 0]},
                    'roi_10yr': {'$round': ['$roi_10yr', 2]},
                    'payback_years': {'$round': ['$payback_years', 1]}
                }
            },
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
        import traceback
        print(f"Error in ROI calculation: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@aggregations_bp.route('/earnings-distribution', methods=['GET'])
def get_earnings_distribution():
    """Get earnings distribution across schools"""
    try:
        year = int(request.args.get('year', 2023))
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
                '$match': {
                    'earnings.10_yrs_after_entry.median': {'$ne': None, '$gt': 0}
                }
            },
            {
                '$bucket': {
                    'groupBy': '$earnings.10_yrs_after_entry.median',
                    'boundaries': [0, 30000, 40000, 50000, 60000, 70000, 80000, 100000, 150000, 200000, 500000],
                    'default': 'other',
                    'output': {
                        'count': {'$sum': 1},
                        'avg_earnings': {'$avg': '$earnings.10_yrs_after_entry.median'},
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
    """Get cost vs earnings scatter plot data"""
    try:
        year = int(request.args.get('year', 2023))
        state = request.args.get('state')
        ownership = request.args.get('ownership')
        limit = min(int(request.args.get('limit', 200)), 500)
        
        cost_expr = CostsAidCompletionModel.get_cost_field_expr()
        
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
                '$project': {
                    'school_id': 1,
                    'school_name': '$school_info.school.name',
                    'state': '$school_info.school.state',
                    'ownership': '$school_info.school.ownership',
                    'cost': cost_expr,
                    'earnings': '$earnings.10_yrs_after_entry.median',
                    'completion_rate': '$completion.completion_rate_4yr_150nt',
                    'size': '$school_info.school.student.size'
                }
            },
            {
                '$match': {
                    'cost': {'$ne': None, '$gt': 0},
                    'earnings': {'$ne': None, '$gt': 0}
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
        import traceback
        print(f"Error in cost-vs-earnings: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@aggregations_bp.route('/completion-rates', methods=['GET'])
def get_completion_rates():
    """Get completion rate statistics"""
    try:
        group_by = request.args.get('group_by', 'state')
        year = int(request.args.get('year', 2023))
        
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
                '$match': {
                    'completion.completion_rate_4yr_150nt': {'$ne': None}
                }
            },
            {
                '$group': {
                    '_id': group_field_map[group_by],
                    'avg_completion_4yr': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'median_completion_4yr': {
                        '$percentile': {
                            'input': '$completion.completion_rate_4yr_150nt',
                            'p': [0.5],
                            'method': 'approximate'
                        }
                    },
                    'min_completion': {'$min': '$completion.completion_rate_4yr_150nt'},
                    'max_completion': {'$max': '$completion.completion_rate_4yr_150nt'},
                    'school_count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        results = list(CostsAidCompletionModel.get_collection().aggregate(pipeline, allowDiskUse=True))
        
        return jsonify({
            'data': parse_json(results),
            'group_by': group_by,
            'year': year
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in completion-rates: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@aggregations_bp.route('/summary-stats', methods=['GET'])
def get_summary_stats():
    """Get summary statistics for the dataset"""
    try:
        year = int(request.args.get('year', 2023))
        
        cost_expr = CostsAidCompletionModel.get_cost_field_expr()
        
        pipeline = [
            {'$match': {'year': year}},
            {
                '$group': {
                    '_id': None,
                    'total_schools': {'$sum': 1},
                    'schools_with_earnings': {
                        '$sum': {
                            '$cond': [
                                {'$gt': ['$earnings.10_yrs_after_entry.median', 0]},
                                1,
                                0
                            ]
                        }
                    },
                    'schools_with_cost': {
                        '$sum': {
                            '$cond': [
                                {'$gt': [cost_expr, 0]},
                                1,
                                0
                            ]
                        }
                    },
                    'avg_cost': {'$avg': cost_expr},
                    'avg_earnings': {'$avg': '$earnings.10_yrs_after_entry.median'},
                    'avg_completion': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'avg_debt': {'$avg': '$aid.median_debt.completers.overall'}
                }
            }
        ]
        
        results = list(CostsAidCompletionModel.get_collection().aggregate(pipeline))
        
        return jsonify({
            'summary': parse_json(results[0] if results else {}),
            'year': year
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in summary-stats: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500