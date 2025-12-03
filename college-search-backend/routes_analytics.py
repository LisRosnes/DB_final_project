"""
API routes for comprehensive analytics - State-level and School-level analytics
"""
from flask import Blueprint, request, jsonify
from models import CostsAidCompletionModel, SchoolModel
from bson import json_util
import json

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


def parse_json(data):
    """Helper to parse MongoDB ObjectId and other BSON types"""
    return json.loads(json_util.dumps(data))


@analytics_bp.route('/state/<state_code>', methods=['GET'])
def get_state_analytics(state_code):
    """
    Get comprehensive analytics for a specific state
    
    Query parameters:
    - year: Year for data (default 2023)
    """
    try:
        year = int(request.args.get('year', 2023))
        
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
            {'$unwind': '$school_info'},
            {'$match': {'school_info.school.state': state_code}},
            {
                '$facet': {
                    'summary': [
                        {
                            '$group': {
                                '_id': None,
                                'total_schools': {'$sum': 1},
                                'avg_cost': {'$avg': cost_expr},
                                'median_cost': {
                                    '$percentile': {
                                        'input': cost_expr,
                                        'p': [0.5],
                                        'method': 'approximate'
                                    }
                                },
                                'min_cost': {'$min': cost_expr},
                                'max_cost': {'$max': cost_expr},
                                'avg_earnings_6yr': {'$avg': '$earnings.6_yrs_after_entry.median'},
                                'avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                                'median_earnings_10yr': {
                                    '$percentile': {
                                        'input': '$earnings.10_yrs_after_entry.median',
                                        'p': [0.5],
                                        'method': 'approximate'
                                    }
                                },
                                'avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                                'avg_pell_grant_rate': {'$avg': '$aid.pell_grant_rate'},
                                'avg_federal_loan_rate': {'$avg': '$aid.federal_loan_rate'},
                                'avg_default_rate': {'$avg': '$repayment.3_yr_default_rate'}
                            }
                        }
                    ],
                    'by_ownership': [
                        {
                            '$group': {
                                '_id': '$school_info.school.ownership',
                                'count': {'$sum': 1},
                                'avg_cost': {'$avg': cost_expr},
                                'avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                                'avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'}
                            }
                        },
                        {'$sort': {'_id': 1}}
                    ],
                    'top_schools_by_earnings': [
                        {
                            '$match': {
                                'earnings.10_yrs_after_entry.median': {'$ne': None, '$gt': 0}
                            }
                        },
                        {
                            '$project': {
                                'school_id': 1,
                                'school_name': '$school_info.school.name',
                                'city': '$school_info.school.city',
                                'ownership': '$school_info.school.ownership',
                                'cost': cost_expr,
                                'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                                'completion_rate': '$completion.completion_rate_4yr_150nt'
                            }
                        },
                        {'$sort': {'earnings_10yr': -1}},
                        {'$limit': 10}
                    ],
                    'top_schools_by_value': [
                        {
                            '$match': {
                                'earnings.10_yrs_after_entry.median': {'$ne': None, '$gt': 0},
                                '$expr': {'$gt': [cost_expr, 0]}
                            }
                        },
                        {
                            '$project': {
                                'school_id': 1,
                                'school_name': '$school_info.school.name',
                                'city': '$school_info.school.city',
                                'ownership': '$school_info.school.ownership',
                                'cost': cost_expr,
                                'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                                'completion_rate': '$completion.completion_rate_4yr_150nt',
                                'roi': {
                                    '$divide': [
                                        {
                                            '$subtract': [
                                                {'$multiply': ['$earnings.10_yrs_after_entry.median', 10]},
                                                {'$multiply': [cost_expr, 4]}
                                            ]
                                        },
                                        {'$multiply': [cost_expr, 4]}
                                    ]
                                }
                            }
                        },
                        {'$sort': {'roi': -1}},
                        {'$limit': 10}
                    ],
                    'most_affordable': [
                        {
                            '$match': {
                                '$expr': {'$gt': [cost_expr, 0]}
                            }
                        },
                        {
                            '$project': {
                                'school_id': 1,
                                'school_name': '$school_info.school.name',
                                'city': '$school_info.school.city',
                                'ownership': '$school_info.school.ownership',
                                'cost': cost_expr,
                                'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                                'completion_rate': '$completion.completion_rate_4yr_150nt'
                            }
                        },
                        {'$sort': {'cost': 1}},
                        {'$limit': 10}
                    ],
                    'highest_completion': [
                        {
                            '$match': {
                                'completion.completion_rate_4yr_150nt': {'$ne': None, '$gt': 0}
                            }
                        },
                        {
                            '$project': {
                                'school_id': 1,
                                'school_name': '$school_info.school.name',
                                'city': '$school_info.school.city',
                                'ownership': '$school_info.school.ownership',
                                'cost': cost_expr,
                                'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                                'completion_rate': '$completion.completion_rate_4yr_150nt'
                            }
                        },
                        {'$sort': {'completion_rate': -1}},
                        {'$limit': 10}
                    ],
                    'cost_distribution': [
                        {
                            '$match': {
                                '$expr': {'$gt': [cost_expr, 0]}
                            }
                        },
                        {
                            '$bucket': {
                                'groupBy': cost_expr,
                                'boundaries': [0, 10000, 20000, 30000, 40000, 50000, 60000, 100000],
                                'default': 'Other',
                                'output': {
                                    'count': {'$sum': 1},
                                    'avg_earnings': {'$avg': '$earnings.10_yrs_after_entry.median'}
                                }
                            }
                        }
                    ],
                    'earnings_distribution': [
                        {
                            '$match': {
                                'earnings.10_yrs_after_entry.median': {'$ne': None, '$gt': 0}
                            }
                        },
                        {
                            '$bucket': {
                                'groupBy': '$earnings.10_yrs_after_entry.median',
                                'boundaries': [0, 30000, 40000, 50000, 60000, 70000, 80000, 100000, 150000],
                                'default': 'Other',
                                'output': {
                                    'count': {'$sum': 1}
                                }
                            }
                        }
                    ],
                    'all_schools': [
                        {
                            '$project': {
                                'school_id': 1,
                                'school_name': '$school_info.school.name',
                                'city': '$school_info.school.city',
                                'ownership': '$school_info.school.ownership',
                                'cost': cost_expr,
                                'earnings_6yr': '$earnings.6_yrs_after_entry.median',
                                'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                                'completion_rate': '$completion.completion_rate_4yr_150nt',
                                'pell_grant_rate': '$aid.pell_grant_rate',
                                'federal_loan_rate': '$aid.federal_loan_rate',
                                'default_rate': '$repayment.3_yr_default_rate'
                            }
                        },
                        {'$sort': {'school_name': 1}}
                    ]
                }
            }
        ]
        
        results = list(CostsAidCompletionModel.get_collection().aggregate(pipeline, allowDiskUse=True))
        
        if results:
            data = results[0]
            summary = data['summary'][0] if data['summary'] else {}
            
            if summary and 'median_cost' in summary and summary['median_cost']:
                summary['median_cost'] = summary['median_cost'][0] if isinstance(summary['median_cost'], list) else summary['median_cost']
            if summary and 'median_earnings_10yr' in summary and summary['median_earnings_10yr']:
                summary['median_earnings_10yr'] = summary['median_earnings_10yr'][0] if isinstance(summary['median_earnings_10yr'], list) else summary['median_earnings_10yr']
            
            return jsonify({
                'state': state_code,
                'year': year,
                'summary': parse_json(summary),
                'by_ownership': parse_json(data['by_ownership']),
                'top_schools_by_earnings': parse_json(data['top_schools_by_earnings']),
                'top_schools_by_value': parse_json(data['top_schools_by_value']),
                'most_affordable': parse_json(data['most_affordable']),
                'highest_completion': parse_json(data['highest_completion']),
                'cost_distribution': parse_json(data['cost_distribution']),
                'earnings_distribution': parse_json(data['earnings_distribution']),
                'all_schools': parse_json(data['all_schools'])
            }), 200
        
        return jsonify({
            'state': state_code,
            'year': year,
            'summary': {},
            'by_ownership': [],
            'top_schools_by_earnings': [],
            'top_schools_by_value': [],
            'most_affordable': [],
            'highest_completion': [],
            'cost_distribution': [],
            'earnings_distribution': [],
            'all_schools': []
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in state analytics: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/state-comparison', methods=['GET'])
def get_state_comparison():
    """
    Get comparison data across all states for a given year
    
    Query parameters:
    - year: Year for data (default 2023)
    """
    try:
        year = int(request.args.get('year', 2023))
        
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
            {'$unwind': '$school_info'},
            {
                '$group': {
                    '_id': '$school_info.school.state',
                    'total_schools': {'$sum': 1},
                    'avg_cost': {'$avg': cost_expr},
                    'avg_earnings_6yr': {'$avg': '$earnings.6_yrs_after_entry.median'},
                    'avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                    'avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'avg_pell_grant_rate': {'$avg': '$aid.pell_grant_rate'},
                    'avg_default_rate': {'$avg': '$repayment.3_yr_default_rate'},
                    'public_schools': {
                        '$sum': {
                            '$cond': [{'$eq': ['$school_info.school.ownership', 1]}, 1, 0]
                        }
                    },
                    'private_nonprofit_schools': {
                        '$sum': {
                            '$cond': [{'$eq': ['$school_info.school.ownership', 2]}, 1, 0]
                        }
                    },
                    'private_forprofit_schools': {
                        '$sum': {
                            '$cond': [{'$eq': ['$school_info.school.ownership', 3]}, 1, 0]
                        }
                    }
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        results = list(CostsAidCompletionModel.get_collection().aggregate(pipeline, allowDiskUse=True))
        
        return jsonify({
            'year': year,
            'states': parse_json(results)
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in state comparison: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/school/<int:school_id>', methods=['GET'])
def get_school_analytics(school_id):
    """
    Get comprehensive analytics for a specific school
    
    Query parameters:
    - year: Year for data (default 2023)
    - include_history: Include historical trends (default true)
    """
    try:
        year = int(request.args.get('year', 2023))
        include_history = request.args.get('include_history', 'true').lower() == 'true'
        
        cost_expr = CostsAidCompletionModel.get_cost_field_expr()
        
        current_data = CostsAidCompletionModel.get_collection().find_one({
            'school_id': school_id,
            'year': year
        })
        
        if not current_data:
            return jsonify({'error': 'School not found for the specified year'}), 404
        
        school_info = SchoolModel.find_by_id(school_id)
        if not school_info:
            return jsonify({'error': 'School not found'}), 404
        
        state = school_info.get('school', {}).get('state')
        
        state_comparison = None
        if state:
            state_pipeline = [
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
                {'$match': {'school_info.school.state': state}},
                {
                    '$group': {
                        '_id': None,
                        'state_avg_cost': {'$avg': cost_expr},
                        'state_avg_earnings_6yr': {'$avg': '$earnings.6_yrs_after_entry.median'},
                        'state_avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                        'state_avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                        'state_avg_pell_rate': {'$avg': '$aid.pell_grant_rate'},
                        'state_avg_default_rate': {'$avg': '$repayment.3_yr_default_rate'},
                        'total_schools': {'$sum': 1}
                    }
                }
            ]
            state_results = list(CostsAidCompletionModel.get_collection().aggregate(state_pipeline))
            if state_results:
                state_comparison = state_results[0]
                del state_comparison['_id']
        
        national_pipeline = [
            {'$match': {'year': year}},
            {
                '$group': {
                    '_id': None,
                    'national_avg_cost': {'$avg': cost_expr},
                    'national_avg_earnings_6yr': {'$avg': '$earnings.6_yrs_after_entry.median'},
                    'national_avg_earnings_10yr': {'$avg': '$earnings.10_yrs_after_entry.median'},
                    'national_avg_completion_rate': {'$avg': '$completion.completion_rate_4yr_150nt'},
                    'national_avg_pell_rate': {'$avg': '$aid.pell_grant_rate'},
                    'national_avg_default_rate': {'$avg': '$repayment.3_yr_default_rate'},
                    'total_schools': {'$sum': 1}
                }
            }
        ]
        national_results = list(CostsAidCompletionModel.get_collection().aggregate(national_pipeline))
        national_comparison = national_results[0] if national_results else {}
        if national_comparison and '_id' in national_comparison:
            del national_comparison['_id']
        
        historical_data = []
        if include_history:
            historical_pipeline = [
                {'$match': {'school_id': school_id}},
                {
                    '$project': {
                        'year': 1,
                        'cost': cost_expr,
                        'earnings_6yr': '$earnings.6_yrs_after_entry.median',
                        'earnings_10yr': '$earnings.10_yrs_after_entry.median',
                        'completion_rate': '$completion.completion_rate_4yr_150nt',
                        'pell_grant_rate': '$aid.pell_grant_rate',
                        'federal_loan_rate': '$aid.federal_loan_rate',
                        'default_rate': '$repayment.3_yr_default_rate'
                    }
                },
                {'$sort': {'year': 1}}
            ]
            historical_data = list(CostsAidCompletionModel.get_collection().aggregate(historical_pipeline))
        
        school_cost = None
        cost_data = current_data.get('cost', {})
        avg_net_price = cost_data.get('avg_net_price', {})
        if isinstance(avg_net_price, dict):
            school_cost = avg_net_price.get('overall') or avg_net_price.get('public') or avg_net_price.get('private')
        if not school_cost:
            tuition = cost_data.get('tuition', {})
            school_cost = tuition.get('in_state')
        
        school_metrics = {
            'school_id': school_id,
            'school_name': school_info.get('school', {}).get('name'),
            'city': school_info.get('school', {}).get('city'),
            'state': state,
            'ownership': school_info.get('school', {}).get('ownership'),
            'cost': school_cost,
            'earnings_6yr': current_data.get('earnings', {}).get('6_yrs_after_entry', {}).get('median'),
            'earnings_10yr': current_data.get('earnings', {}).get('10_yrs_after_entry', {}).get('median'),
            'completion_rate': current_data.get('completion', {}).get('completion_rate_4yr_150nt'),
            'completion_rate_100': current_data.get('completion', {}).get('completion_rate_4yr_100nt'),
            'completion_rate_200': current_data.get('completion', {}).get('completion_rate_4yr_200nt'),
            'pell_grant_rate': current_data.get('aid', {}).get('pell_grant_rate'),
            'federal_loan_rate': current_data.get('aid', {}).get('federal_loan_rate'),
            'default_rate': current_data.get('repayment', {}).get('3_yr_default_rate'),
            'completion_by_race': {
                'white': current_data.get('completion', {}).get('completion_rate_4yr_150_white'),
                'black': current_data.get('completion', {}).get('completion_rate_4yr_150_black'),
                'hispanic': current_data.get('completion', {}).get('completion_rate_4yr_150_hispanic'),
                'asian': current_data.get('completion', {}).get('completion_rate_4yr_150_asian'),
            },
            'aid_details': current_data.get('aid', {}),
            'cost_details': current_data.get('cost', {}),
            'completion_details': current_data.get('completion', {})
        }
        
        if school_cost and school_metrics['earnings_10yr']:
            total_cost = school_cost * 4
            total_earnings = school_metrics['earnings_10yr'] * 10
            school_metrics['roi'] = (total_earnings - total_cost) / total_cost if total_cost > 0 else None
            school_metrics['payback_years'] = total_cost / school_metrics['earnings_10yr'] if school_metrics['earnings_10yr'] > 0 else None
        
        return jsonify({
            'school_id': school_id,
            'year': year,
            'metrics': parse_json(school_metrics),
            'state_comparison': parse_json(state_comparison) if state_comparison else None,
            'national_comparison': parse_json(national_comparison),
            'historical_trends': parse_json(historical_data)
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in school analytics: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/available-years', methods=['GET'])
def get_available_years():
    """Get list of available years in the dataset"""
    try:
        pipeline = [
            {
                '$group': {
                    '_id': '$year'
                }
            },
            {'$sort': {'_id': -1}}
        ]
        
        results = list(CostsAidCompletionModel.get_collection().aggregate(pipeline))
        years = [r['_id'] for r in results if r['_id']]
        
        return jsonify({
            'years': years
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500