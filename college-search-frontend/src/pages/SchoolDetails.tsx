import React, { useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { schoolsAPI } from '../services/api';

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [schoolName, setSchoolName] = React.useState<string>('');
  const [schoolDetails, setSchoolDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await schoolsAPI.getById(Number(id));
        setSchoolName(response.school?.name || 'School not found');
      } catch {
        setSchoolName('School not found');
      }
    };
    fetchSchool();
  }, [id]);

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await schoolsAPI.getDetails(Number(id), 2024, true);
        setSchoolDetails(details);
      } catch (err) {
        setError('Failed to load school details.');
      }
      setLoading(false);
    };
    fetchSchoolDetails();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="container" style={{ paddingTop: '2rem' }}>
          <p>Loading school details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ paddingTop: '2rem' }}>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="text-2xl font-bold mb-4">{schoolName}</h1>
        {/* Add more details here later */}
        <div>

        </div>
      </div>
      <div style={{ marginTop: '6rem' }}></div>
    </div>
  );
};

export default SchoolDetails;
