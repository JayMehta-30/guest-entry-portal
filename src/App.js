import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyDoDvm8AGY_2i93l8AT427Cl0qunF8C9lc",
  authDomain: "license-plate-recognitio-c5b0c.firebaseapp.com",
  databaseURL: "https://license-plate-recognitio-c5b0c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "license-plate-recognitio-c5b0c",
  storageBucket: "license-plate-recognitio-c5b0c.firebasestorage.app",
  messagingSenderId: "742359689844",
  appId: "1:742359689844:web:391154c3ece2c72f94bf21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    flatNumber: '',
    purpose: ''
  });
  const [status, setStatus] = useState(null);
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'guestRequests'), {
        ...formData,
        status: 'pending',
        timestamp: new Date(),
      });

      // Start 3-minute countdown
      setTimer(180);
      const intervalId = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setStatus('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Listen for status changes
      const unsubscribe = onSnapshot(doc(db, 'guestRequests', docRef.id), (doc) => {
        const data = doc.data();
        if (data?.status === 'approved') {
          clearInterval(intervalId);
          setStatus('approved');
          setTimer(null);
        } else if (data?.status === 'denied') {
          clearInterval(intervalId);
          setStatus('denied');
          setTimer(null);
        }
      });

      // Clear listener after 3 minutes
      setTimeout(() => {
        unsubscribe();
      }, 180000);

      setFormData({
        name: '',
        phone: '',
        flatNumber: '',
        purpose: ''
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Guest Entry Portal</h1>
        <p>Please fill in your details to request entry</p>

        {status && (
          <div className={`status-message ${status}`}>
            {status === 'approved' && (
              <>
                ✓ Welcome to Ocean Breeze
                <div className="sub-message">Gate is opening...</div>
              </>
            )}
            {status === 'denied' && (
              <>
                ✗ Sorry, you are not allowed to enter.
              </>
            )}
            {status === 'timeout' && (
              <>
                ! Request timed out. Please try again.
              </>
            )}
            {status === 'error' && (
              <>
                ! An error occurred. Please try again.
              </>
            )}
          </div>
        )}

        {timer !== null && (
          <div className="timer">
            Waiting for response: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name *"
            required
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number *"
            pattern="[0-9]{10}"
            required
          />
          <input
            type="text"
            name="flatNumber"
            value={formData.flatNumber}
            onChange={handleChange}
            placeholder="Flat Number *"
            required
          />
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="Purpose of Visit *"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
