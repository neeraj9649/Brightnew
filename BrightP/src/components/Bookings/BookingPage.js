import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import toast from 'react-hot-toast';
import './BookingPage.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData, isAdmin } = useAuth();
  const { submitBooking, bookings, loading } = useBooking();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'flights');
  const [formData, setFormData] = useState({

  });
  const [submitting, setSubmitting] = useState(false);

  // Flight form initial state
  const flightInitialState = {
    type: 'flight',
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    class: 'economy',
    tripType: 'roundtrip',
    specialRequests: ''
  };

  // Hotel form initial state
  const hotelInitialState = {
    type: 'hotel',
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
    roomType: 'standard',
    specialRequests: ''
  };

  // Tour form initial state
  const tourInitialState = {
    type: 'tour',
    destination: '',
    tourType: 'cultural',
    startDate: '',
    endDate: '',
    participants: 1,
    accommodation: 'standard',
    activities: [],
    specialRequests: ''
  };

  // Visa form initial state
  const visaInitialState = {
    type: 'visa',
    country: '',
    visaType: 'tourist',
    purpose: 'tourism',
    duration: '',
    travelDate: '',
    urgency: 'regular',
    specialRequests: ''
  };

  useEffect(() => {
    // Initialize form data based on active tab
    const initialStates = {
      flights: flightInitialState,
      hotels: hotelInitialState,
      tours: tourInitialState,
      visa: visaInitialState
    };
    
    setFormData(initialStates[activeTab] || {});
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'activities') {
        setFormData(prev => ({
          ...prev,
          activities: checked 
            ? [...(prev.activities || []), value]
            : (prev.activities || []).filter(item => item !== value)
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateEstimatedCost = (data) => {
    let baseCost = 0;
    
    switch (data.type) {
      case 'flight':
        baseCost = data.class === 'economy' ? 500 : data.class === 'business' ? 1200 : 2500;
        baseCost *= data.passengers || 1;
        if (data.tripType === 'roundtrip') baseCost *= 1.8;
        break;
      case 'hotel':
        baseCost = data.roomType === 'standard' ? 100 : data.roomType === 'deluxe' ? 200 : 400;
        const nights = data.checkIn && data.checkOut 
          ? Math.ceil((new Date(data.checkOut) - new Date(data.checkIn)) / (1000 * 60 * 60 * 24))
          : 1;
        baseCost *= nights * (data.rooms || 1);
        break;
      case 'tour':
        baseCost = data.tourType === 'cultural' ? 800 : data.tourType === 'adventure' ? 1200 : 600;
        baseCost *= data.participants || 1;
        if (data.accommodation === 'luxury') baseCost *= 1.5;
        break;
      case 'visa':
        baseCost = data.urgency === 'express' ? 200 : data.urgency === 'urgent' ? 150 : 100;
        break;
    }
    
    return Math.round(baseCost);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const estimatedCost = calculateEstimatedCost(formData);
      const bookingData = {
        ...formData,
        estimatedCost,
        submittedAt: new Date().toISOString()
      };

      await submitBooking(bookingData);
      
      // Reset form
      setFormData(activeTab === 'flights' ? flightInitialState : 
                  activeTab === 'hotels' ? hotelInitialState :
                  activeTab === 'tours' ? tourInitialState : visaInitialState);
      
      toast.success('Booking request submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit booking request');
      console.error('Booking submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Flight Form Component
  const FlightForm = () => (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="form-header">
        <i className="fas fa-plane"></i>
        <h2>Book Your Flight</h2>
        <p>Find the perfect flight for your journey</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Trip Type</label>
          <select name="tripType" value={formData.tripType || 'roundtrip'} onChange={handleInputChange}>
            <option value="roundtrip">Round Trip</option>
            <option value="oneway">One Way</option>
            <option value="multicity">Multi City</option>
          </select>
        </div>

        <div className="form-group">
          <label>Class</label>
          <select name="class" value={formData.class || 'economy'} onChange={handleInputChange}>
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </select>
        </div>

        <div className="form-group">
          <label>From</label>
          <input
            type="text"
            name="from"
            value={formData.from || ''}
            onChange={handleInputChange}
            placeholder="Departure city"
            required
          />
        </div>

        <div className="form-group">
          <label>To</label>
          <input
            type="text"
            name="to"
            value={formData.to || ''}
            onChange={handleInputChange}
            placeholder="Destination city"
            required
          />
        </div>

        <div className="form-group">
          <label>Departure Date</label>
          <input
            type="date"
            name="departureDate"
            value={formData.departureDate || ''}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {formData.tripType === 'roundtrip' && (
          <div className="form-group">
            <label>Return Date</label>
            <input
              type="date"
              name="returnDate"
              value={formData.returnDate || ''}
              onChange={handleInputChange}
              min={formData.departureDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        <div className="form-group">
          <label>Passengers</label>
          <select name="passengers" value={formData.passengers || 1} onChange={handleInputChange}>
            {[...Array(9)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Passenger' : 'Passengers'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group full-width">
        <label>Special Requests</label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests || ''}
          onChange={handleInputChange}
          placeholder="Any special requirements or requests..."
          rows="4"
        />
      </div>

      <div className="form-summary">
        {/* cost estimate hidden -- payments & deals handled offline */}
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Submitting...' : 'Submit Flight Request'}
        </button>
      </div>
    </form>
  );

  // Hotel Form Component
  const HotelForm = () => (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="form-header">
        <i className="fas fa-bed"></i>
        <h2>Book Your Hotel</h2>
        <p>Find comfortable accommodation for your stay</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Destination</label>
          <input
            type="text"
            name="destination"
            value={formData.destination || ''}
            onChange={handleInputChange}
            placeholder="City or hotel name"
            required
          />
        </div>

        <div className="form-group">
          <label>Room Type</label>
          <select name="roomType" value={formData.roomType || 'standard'} onChange={handleInputChange}>
            <option value="standard">Standard Room</option>
            <option value="deluxe">Deluxe Room</option>
            <option value="suite">Suite</option>
          </select>
        </div>

        <div className="form-group">
          <label>Check-in Date</label>
          <input
            type="date"
            name="checkIn"
            value={formData.checkIn || ''}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Check-out Date</label>
          <input
            type="date"
            name="checkOut"
            value={formData.checkOut || ''}
            onChange={handleInputChange}
            min={formData.checkIn || new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Guests</label>
          <select name="guests" value={formData.guests || 1} onChange={handleInputChange}>
            {[...Array(8)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Rooms</label>
          <select name="rooms" value={formData.rooms || 1} onChange={handleInputChange}>
            {[...Array(5)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Room' : 'Rooms'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group full-width">
        <label>Special Requests</label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests || ''}
          onChange={handleInputChange}
          placeholder="Any special requirements or requests..."
          rows="4"
        />
      </div>

      <div className="form-summary">
        {/* cost estimate hidden -- payments & deals handled offline */}
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Submitting...' : 'Submit Hotel Request'}
        </button>
      </div>
    </form>
  );

  // Tour Form Component
  const TourForm = () => (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="form-header">
        <i className="fas fa-map-marked-alt"></i>
        <h2>Book Your Tour</h2>
        <p>Discover amazing destinations with guided tours</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Destination</label>
          <input
            type="text"
            name="destination"
            value={formData.destination || ''}
            onChange={handleInputChange}
            placeholder="Tour destination"
            required
          />
        </div>

        <div className="form-group">
          <label>Tour Type</label>
          <select name="tourType" value={formData.tourType || 'cultural'} onChange={handleInputChange}>
            <option value="cultural">Cultural Tour</option>
            <option value="adventure">Adventure Tour</option>
            <option value="relaxation">Relaxation Tour</option>
            <option value="food">Food Tour</option>
            <option value="historical">Historical Tour</option>
          </select>
        </div>

        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate || ''}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate || ''}
            onChange={handleInputChange}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Participants</label>
          <select name="participants" value={formData.participants || 1} onChange={handleInputChange}>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Person' : 'People'}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Accommodation</label>
          <select name="accommodation" value={formData.accommodation || 'standard'} onChange={handleInputChange}>
            <option value="standard">Standard</option>
            <option value="comfort">Comfort</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>
      </div>

      <div className="form-group full-width">
        <label>Preferred Activities (Select all that apply)</label>
        <div className="checkbox-group">
          {['Sightseeing', 'Museums', 'Local Cuisine', 'Shopping', 'Nature Walks', 'Photography'].map(activity => (
            <label key={activity} className="checkbox-label">
              <input
                type="checkbox"
                name="activities"
                value={activity}
                checked={(formData.activities || []).includes(activity)}
                onChange={handleInputChange}
              />
              <span>{activity}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group full-width">
        <label>Special Requests</label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests || ''}
          onChange={handleInputChange}
          placeholder="Any special requirements or requests..."
          rows="4"
        />
      </div>

      <div className="form-summary">
        {/* cost estimate hidden -- payments & deals handled offline */}
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Submitting...' : 'Submit Tour Request'}
        </button>
      </div>
    </form>
  );

  // Visa Form Component
  const VisaForm = () => (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="form-header">
        <i className="fas fa-passport"></i>
        <h2>Visa Application</h2>
        <p>Get assistance with your visa application process</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Destination Country</label>
          <input
            type="text"
            name="country"
            value={formData.country || ''}
            onChange={handleInputChange}
            placeholder="Country you want to visit"
            required
          />
        </div>

        <div className="form-group">
          <label>Visa Type</label>
          <select name="visaType" value={formData.visaType || 'tourist'} onChange={handleInputChange}>
            <option value="tourist">Tourist Visa</option>
            <option value="business">Business Visa</option>
            <option value="student">Student Visa</option>
            <option value="work">Work Visa</option>
            <option value="transit">Transit Visa</option>
          </select>
        </div>

        <div className="form-group">
          <label>Purpose of Travel</label>
          <select name="purpose" value={formData.purpose || 'tourism'} onChange={handleInputChange}>
            <option value="tourism">Tourism</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="work">Work</option>
            <option value="family">Family Visit</option>
            <option value="medical">Medical Treatment</option>
          </select>
        </div>

        <div className="form-group">
          <label>Intended Duration</label>
          <select name="duration" value={formData.duration || ''} onChange={handleInputChange} required>
            <option value="">Select duration</option>
            <option value="1-7 days">1-7 days</option>
            <option value="1-2 weeks">1-2 weeks</option>
            <option value="2-4 weeks">2-4 weeks</option>
            <option value="1-3 months">1-3 months</option>
            <option value="3-6 months">3-6 months</option>
            <option value="6+ months">6+ months</option>
          </select>
        </div>

        <div className="form-group">
          <label>Intended Travel Date</label>
          <input
            type="date"
            name="travelDate"
            value={formData.travelDate || ''}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Processing Urgency</label>
          <select name="urgency" value={formData.urgency || 'regular'} onChange={handleInputChange}>
            <option value="regular">Regular (15-20 days)</option>
            <option value="urgent">Urgent (7-10 days)</option>
            <option value="express">Express (3-5 days)</option>
          </select>
        </div>
      </div>

      <div className="form-group full-width">
        <label>Special Requests or Additional Information</label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests || ''}
          onChange={handleInputChange}
          placeholder="Any additional information or special requirements..."
          rows="4"
        />
      </div>

      <div className="form-summary">
        {/* Service fee removed -- payments & deals handled offline. */}
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Submitting...' : 'Submit Visa Request'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="booking-page mt-32">
      {/* Header */}
      <header className="booking-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Dashboard</span>
          </button>
          
          <div className="header-title">
            <h1>New Booking Request</h1>
            <p>Choose your service and fill out the booking form</p>
          </div>

          {isAdmin && (
            <button onClick={() => navigate('/admin')} className="admin-btn">
              <i className="fas fa-cog"></i>
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </header>

      {/* Booking Tabs */}
      <div className="booking-tabs mt-5">
        <div className="tab-buttons">
          {[
            { id: 'flights', label: 'Flights', icon: 'fas fa-plane' },
            { id: 'hotels', label: 'Hotels', icon: 'fas fa-bed' },
            { id: 'tours', label: 'Tours', icon: 'fas fa-map-marked-alt' },
            { id: 'visa', label: 'Visa', icon: 'fas fa-passport' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Booking Forms */}
      <div className="booking-content">
        <div className="booking-container">
          {activeTab === 'flights' && <FlightForm />}
          {activeTab === 'hotels' && <HotelForm />}
          {activeTab === 'tours' && <TourForm />}
          {activeTab === 'visa' && <VisaForm />}
        </div>

        {/* Recent Bookings Sidebar */}
        <div className="bookings-sidebar">
          <div className="sidebar-header">
            <h3>Your Recent Requests</h3>
            <span className="booking-count">{bookings.length} total</span>
          </div>
          
          <div className="recent-bookings-list">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-clipboard-list"></i>
                <p>No bookings yet</p>
                <span>Your booking requests will appear here</span>
              </div>
            ) : (
              bookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-icon">
                    <i className={`fas fa-${
                      booking.type === 'flight' ? 'plane' :
                      booking.type === 'hotel' ? 'bed' :
                      booking.type === 'tour' ? 'map-marked-alt' : 'passport'
                    }`}></i>
                  </div>
                  <div className="booking-details">
                    <h4>{booking.id}</h4>
                    <p>{booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}</p>
                    <span className={`status ${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="booking-cost">
                    ${booking.estimatedCost || booking.finalCost || 0}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {bookings.length > 5 && (
            <button 
              onClick={() => navigate('/dashboard')}
              className="view-all-btn"
            >
              View All Bookings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;