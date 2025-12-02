import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { schoolsAPI } from '../services/api';

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [schoolName, setSchoolName] = React.useState<string>('');

  React.useEffect(() => {
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

  return (
    <div>
      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="text-2xl font-bold mb-4">{schoolName}</h1>
        {/* Add more details here later */}
      </div>
    </div>
  );
};

export default SchoolDetails;
