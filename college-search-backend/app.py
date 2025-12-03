"""
Main Flask application for College Search Backend
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import routes
from routes_schools import schools_bp
from routes_programs import programs_bp
from routes_aggregations import aggregations_bp
from routes_analytics import analytics_bp

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure Flask
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JSON_SORT_KEYS'] = False

# Register blueprints
app.register_blueprint(schools_bp)
app.register_blueprint(programs_bp)
app.register_blueprint(aggregations_bp)
app.register_blueprint(analytics_bp)


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'online',
        'message': 'College Search API is running',
        'version': '1.0.0'
    })


@app.route('/api/health')
def health():
    """Detailed health check"""
    try:
        from database import get_database
        db = get_database()
        # Try to ping the database
        db.client.admin.command('ping')
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'endpoints': {
            'schools': '/api/schools',
            'programs': '/api/programs',
            'aggregations': '/api/aggregations',
            'analytics': '/api/analytics'
        }
    })


@app.route('/api/docs')
def api_docs():
    """API documentation endpoint"""
    return jsonify({
        'api_version': '1.0.0',
        'endpoints': {
            'schools': {
                'GET /api/schools/filter': 'Filter schools by various criteria',
                'GET /api/schools/search': 'Search schools by name',
                'GET /api/schools/compare': 'Compare multiple schools',
                'GET /api/schools/<school_id>': 'Get detailed school information',
                'GET /api/schools/states': 'Get list of states'
            },
            'programs': {
                'GET /api/programs/trends': 'Get ROI and salary trends by program',
                'POST /api/programs/compare': 'Compare a program across schools',
                'GET /api/programs/majors': 'Get list of available majors',
                'GET /api/programs/cip-codes': 'Get CIP code reference',
                'GET /api/programs/school/<school_id>': 'Get programs for a school'
            },
            'aggregations': {
                'GET /api/aggregations/state': 'Get state-level aggregations',
                'GET /api/aggregations/roi': 'Calculate ROI metrics',
                'GET /api/aggregations/earnings-distribution': 'Get earnings distribution',
                'GET /api/aggregations/cost-vs-earnings': 'Get cost vs earnings data',
                'GET /api/aggregations/completion-rates': 'Get completion rate statistics'
            },
            'analytics': {
                'GET /api/analytics/state/<state_code>': 'Get comprehensive state analytics',
                'GET /api/analytics/state-comparison': 'Get comparison data across all states',
                'GET /api/analytics/school/<school_id>': 'Get comprehensive school analytics',
                'GET /api/analytics/available-years': 'Get list of available years'
            }
        },
        'documentation': 'See README.md for detailed usage examples'
    })


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"\n{'='*60}")
    print(f"College Search API Starting...")
    print(f"{'='*60}")
    print(f"Host: http://localhost:{port}")
    print(f"Debug Mode: {debug}")
    print(f"API Docs: http://localhost:{port}/api/docs")
    print(f"{'='*60}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)