import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">About College Search Platform</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
          <p className="text-gray mb-4">
            The College Search Platform aims to simplify the college selection process by centralizing 
            key information—such as cost, major, location, and job outcomes—using the U.S. Department 
            of Education's College Scorecard dataset. We empower students and families to make 
            transparent, data-informed decisions about higher education.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Key Features</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="font-semibold mb-2">🔍 Smart Filtering</h3>
              <p className="text-sm text-gray">
                Filter universities by cost, outcomes, location, major, and more to find schools 
                that match your criteria.
              </p>
            </div>
            <div className="card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="font-semibold mb-2">⚖️ Side-by-Side Comparison</h3>
              <p className="text-sm text-gray">
                Compare multiple schools at once across all major metrics including cost, 
                earnings, completion rates, and more.
              </p>
            </div>
            <div className="card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="font-semibold mb-2">📊 ROI & Salary Trends</h3>
              <p className="text-sm text-gray">
                Visualize return on investment and salary trends by major to understand 
                the financial outcomes of different programs.
              </p>
            </div>
            <div className="card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="font-semibold mb-2">🗺️ Geographic Insights</h3>
              <p className="text-sm text-gray">
                Explore state-level trends and aggregations to understand regional 
                differences in cost, outcomes, and opportunities.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Data Source</h2>
          <p className="text-gray mb-4">
            All data is sourced from the{' '}
            <a
              href="https://collegescorecard.ed.gov/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary-color)' }}
            >
              U.S. Department of Education's College Scorecard
            </a>
            , which provides the most comprehensive data on college costs and outcomes. The dataset 
            includes information from over 7,000 institutions across multiple years, covering:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '2rem' }} className="text-gray">
            <li>Admission rates and test scores</li>
            <li>Cost of attendance and financial aid</li>
            <li>Completion and retention rates</li>
            <li>Post-graduation earnings</li>
            <li>Student demographics</li>
            <li>Program-specific outcomes</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Understanding the Data</h2>
          <div className="card" style={{ backgroundColor: '#fef3c7' }}>
            <h3 className="font-semibold mb-2">Important Notes:</h3>
            <ul className="text-sm" style={{ listStyle: 'disc', paddingLeft: '2rem' }}>
              <li className="mb-2">
                <strong>Net Price vs. Sticker Price:</strong> We display average net price, 
                which is the actual cost after financial aid, not the published sticker price.
              </li>
              <li className="mb-2">
                <strong>Earnings Data:</strong> Earnings are based on students who received 
                federal financial aid and are working (not enrolled in further education).
              </li>
              <li className="mb-2">
                <strong>Completion Rates:</strong> Rates vary by cohort type (first-time, 
                full-time students vs. all students).
              </li>
              <li>
                <strong>Data Availability:</strong> Not all metrics are available for all schools. 
                "N/A" indicates missing data.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <a href="/college-search" className="btn btn-primary">
            Start Searching
          </a>
          <a 
            href="https://collegescorecard.ed.gov/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Visit College Scorecard →
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
