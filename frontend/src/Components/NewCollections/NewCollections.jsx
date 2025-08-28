import React, { useEffect, useState } from 'react';
import './NewCollections.css';
import Item from '../Item/Item';

const BACKEND_URL = "https://e-comm-backend-viqg.onrender.com";

const NewCollections = () => {
  const [new_collection, setNew_collection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewCollection = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/newcollection`);
        const data = await response.json();
        setNew_collection(data);
      } catch (err) {
        console.error("Fetch NewCollection Error:", err);
        setError("Failed to load new collections.");
      } finally {
        setLoading(false);
      }
    };

    fetchNewCollection();
  }, []);

  if (loading) return <p>Loading new collections...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className='new-collections'>
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
        {new_collection.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default NewCollections;
