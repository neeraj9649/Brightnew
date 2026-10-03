import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import Navbar from '../components/Layout/Navbar';
import toast from 'react-hot-toast';

// Shared Tailwind class strings (replaces the old BookingsPage.css). px arbitrary
// values because the root font-size is 14px; colors via the index.css var tokens.
const groupCls = "flex flex-col gap-[8px]";
const fullWidthCls = `${groupCls} col-span-1 min-[769px]:col-span-2`;
const labelCls =
  "text-[var(--color-text)] font-[550] text-[12px] uppercase tracking-[-0.01em]";
const fieldCls =
  "px-[16px] py-[12px] border-2 border-[var(--color-border)] rounded-[8px] text-[14px] bg-[var(--color-surface)] text-[var(--color-text)] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]";
const textareaCls = `${fieldCls} resize-y min-h-[100px]`;
const gridCls =
  "grid grid-cols-1 gap-[16px] mb-[24px] min-[481px]:gap-[24px] min-[481px]:mb-[32px] min-[769px]:grid-cols-2";
const formCls = "p-[16px] min-[481px]:p-[32px]";
const formHeaderCls =
  "text-center mb-[24px] pb-[16px] min-[481px]:mb-[32px] min-[481px]:pb-[24px] border-b border-[var(--color-card-border-inner)]";
const formHeaderIconCls =
  "text-[24px] min-[481px]:text-[30px] text-[var(--color-primary)] mb-[16px]";
const formHeaderTitleCls =
  "text-[var(--color-text)] text-[20px] min-[481px]:text-[24px] font-[600] mb-[8px]";
const formHeaderSubCls = "text-[var(--color-text-secondary)] text-[14px] m-0";
const summaryCls =
  "flex max-[768px]:flex-col min-[769px]:flex-row justify-between items-center gap-[16px] min-[769px]:gap-0 p-[24px] bg-[var(--color-secondary)] rounded-[10px] border border-[var(--color-border)]";
const submitBtnCls =
  "inline-flex items-center justify-center gap-[8px] py-[12px] px-[24px] rounded-[8px] font-[550] text-[14px] border-none cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--color-primary)] text-[var(--color-btn-primary-text)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)] disabled:bg-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full min-[769px]:w-auto";
const checkboxGroupCls =
  "grid grid-cols-1 gap-[12px] mt-[8px] min-[769px]:grid-cols-2";
const checkboxLabelCls =
  "flex items-center gap-[12px] p-[12px] bg-[var(--color-secondary)] border border-[var(--color-border)] rounded-[8px] cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-secondary-hover)] hover:border-[var(--color-primary)]";

const STATUS_CLS = {
  pending:
    "bg-[rgba(var(--color-warning-rgb),0.15)] text-[var(--color-warning)] border-[rgba(var(--color-warning-rgb),0.25)]",
  confirmed:
    "bg-[rgba(var(--color-success-rgb),0.15)] text-[var(--color-success)] border-[rgba(var(--color-success-rgb),0.25)]",
  rejected:
    "bg-[rgba(var(--color-error-rgb),0.15)] text-[var(--color-error)] border-[rgba(var(--color-error-rgb),0.25)]",
  cancelled:
    "bg-[rgba(var(--color-info-rgb),0.15)] text-[var(--color-info)] border-[rgba(var(--color-info-rgb),0.25)]",
};
const statusBaseCls =
  "inline-block py-[2px] px-[8px] rounded-full text-[11px] font-[550] uppercase border";

// Move form components OUTSIDE the main component to prevent recreation
const FlightForm = ({ formData, onInputChange, onSubmit, submitting, calculateCost }) => (
  <form onSubmit={onSubmit} className={formCls}>
    <div className={formHeaderCls}>
      <i className={`fas fa-plane ${formHeaderIconCls}`}></i>
      <h2 className={formHeaderTitleCls}>Book Your Flight</h2>
      <p className={formHeaderSubCls}>Find the perfect flight for your journey</p>
    </div>

    <div className={gridCls}>
      <div className={groupCls}>
        <label className={labelCls}>Trip Type</label>
        <select className={fieldCls} name="tripType" value={formData.tripType || 'roundtrip'} onChange={onInputChange}>
          <option value="roundtrip">Round Trip</option>
          <option value="oneway">One Way</option>
          <option value="multicity">Multi City</option>
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Class</label>
        <select className={fieldCls} name="class" value={formData.class || 'economy'} onChange={onInputChange}>
          <option value="economy">Economy</option>
          <option value="business">Business</option>
          <option value="first">First Class</option>
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>From</label>
        <input
          className={fieldCls}
          type="text"
          name="from"
          value={formData.from || ''}
          onChange={onInputChange}
          placeholder="Departure city"
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>To</label>
        <input
          className={fieldCls}
          type="text"
          name="to"
          value={formData.to || ''}
          onChange={onInputChange}
          placeholder="Destination city"
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Departure Date</label>
        <input
          className={fieldCls}
          type="date"
          name="departureDate"
          value={formData.departureDate || ''}
          onChange={onInputChange}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      {formData.tripType === 'roundtrip' && (
        <div className={groupCls}>
          <label className={labelCls}>Return Date</label>
          <input
            className={fieldCls}
            type="date"
            name="returnDate"
            value={formData.returnDate || ''}
            onChange={onInputChange}
            min={formData.departureDate || new Date().toISOString().split('T')[0]}
          />
        </div>
      )}

      <div className={groupCls}>
        <label className={labelCls}>Passengers</label>
        <select className={fieldCls} name="passengers" value={formData.passengers || 1} onChange={onInputChange}>
          {[...Array(9)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Passenger' : 'Passengers'}</option>
          ))}
        </select>
      </div>
    </div>

    <div className={fullWidthCls + ' mb-[24px] min-[481px]:mb-[32px]'}>
      <label className={labelCls}>Special Requests</label>
      <textarea
        className={textareaCls}
        name="specialRequests"
        value={formData.specialRequests || ''}
        onChange={onInputChange}
        placeholder="Any special requirements or requests..."
        rows="4"
      />
    </div>

    <div className={summaryCls}>
      {/* cost estimate hidden -- payments & deals handled offline */}
      <button type="submit" disabled={submitting} className={submitBtnCls}>
        {submitting ? 'Submitting...' : 'Submit Flight Request'}
      </button>
    </div>
  </form>
);

const HotelForm = ({ formData, onInputChange, onSubmit, submitting, calculateCost }) => (
  <form onSubmit={onSubmit} className={formCls}>
    <div className={formHeaderCls}>
      <i className={`fas fa-bed ${formHeaderIconCls}`}></i>
      <h2 className={formHeaderTitleCls}>Book Your Hotel</h2>
      <p className={formHeaderSubCls}>Find comfortable accommodation for your stay</p>
    </div>

    <div className={gridCls}>
      <div className={groupCls}>
        <label className={labelCls}>Destination</label>
        <input
          className={fieldCls}
          type="text"
          name="destination"
          value={formData.destination || ''}
          onChange={onInputChange}
          placeholder="City or hotel name"
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Room Type</label>
        <select className={fieldCls} name="roomType" value={formData.roomType || 'standard'} onChange={onInputChange}>
          <option value="standard">Standard Room</option>
          <option value="deluxe">Deluxe Room</option>
          <option value="suite">Suite</option>
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Check-in Date</label>
        <input
          className={fieldCls}
          type="date"
          name="checkIn"
          value={formData.checkIn || ''}
          onChange={onInputChange}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Check-out Date</label>
        <input
          className={fieldCls}
          type="date"
          name="checkOut"
          value={formData.checkOut || ''}
          onChange={onInputChange}
          min={formData.checkIn || new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Guests</label>
        <select className={fieldCls} name="guests" value={formData.guests || 1} onChange={onInputChange}>
          {[...Array(8)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>
          ))}
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Rooms</label>
        <select className={fieldCls} name="rooms" value={formData.rooms || 1} onChange={onInputChange}>
          {[...Array(5)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Room' : 'Rooms'}</option>
          ))}
        </select>
      </div>
    </div>

    <div className={fullWidthCls + ' mb-[24px] min-[481px]:mb-[32px]'}>
      <label className={labelCls}>Special Requests</label>
      <textarea
        className={textareaCls}
        name="specialRequests"
        value={formData.specialRequests || ''}
        onChange={onInputChange}
        placeholder="Any special requirements or requests..."
        rows="4"
      />
    </div>

    <div className={summaryCls}>
      {/* cost estimate hidden -- payments & deals handled offline */}
      <button type="submit" disabled={submitting} className={submitBtnCls}>
        {submitting ? 'Submitting...' : 'Submit Hotel Request'}
      </button>
    </div>
  </form>
);

const TourForm = ({ formData, onInputChange, onSubmit, submitting, calculateCost }) => (
  <form onSubmit={onSubmit} className={formCls}>
    <div className={formHeaderCls}>
      <i className={`fas fa-map-marked-alt ${formHeaderIconCls}`}></i>
      <h2 className={formHeaderTitleCls}>Book Your Tour</h2>
      <p className={formHeaderSubCls}>Discover amazing destinations with guided tours</p>
    </div>

    <div className={gridCls}>
      <div className={groupCls}>
        <label className={labelCls}>Destination</label>
        <input
          className={fieldCls}
          type="text"
          name="destination"
          value={formData.destination || ''}
          onChange={onInputChange}
          placeholder="Tour destination"
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Tour Type</label>
        <select className={fieldCls} name="tourType" value={formData.tourType || 'cultural'} onChange={onInputChange}>
          <option value="cultural">Cultural Tour</option>
          <option value="adventure">Adventure Tour</option>
          <option value="relaxation">Relaxation Tour</option>
          <option value="food">Food Tour</option>
          <option value="historical">Historical Tour</option>
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Start Date</label>
        <input
          className={fieldCls}
          type="date"
          name="startDate"
          value={formData.startDate || ''}
          onChange={onInputChange}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>End Date</label>
        <input
          className={fieldCls}
          type="date"
          name="endDate"
          value={formData.endDate || ''}
          onChange={onInputChange}
          min={formData.startDate || new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Participants</label>
        <select className={fieldCls} name="participants" value={formData.participants || 1} onChange={onInputChange}>
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Person' : 'People'}</option>
          ))}
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Accommodation</label>
        <select className={fieldCls} name="accommodation" value={formData.accommodation || 'standard'} onChange={onInputChange}>
          <option value="standard">Standard</option>
          <option value="comfort">Comfort</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>
    </div>

    <div className={fullWidthCls + ' mb-[24px] min-[481px]:mb-[32px]'}>
      <label className={labelCls}>Preferred Activities (Select all that apply)</label>
      <div className={checkboxGroupCls}>
        {['Sightseeing', 'Museums', 'Local Cuisine', 'Shopping', 'Nature Walks', 'Photography'].map(activity => {
          const checked = (formData.activities || []).includes(activity);
          return (
            <label key={activity} className={checkboxLabelCls}>
              <input
                className="m-0"
                type="checkbox"
                name="activities"
                value={activity}
                checked={checked}
                onChange={onInputChange}
              />
              <span className={checked ? 'text-[var(--color-primary)] font-[550]' : ''}>{activity}</span>
            </label>
          );
        })}
      </div>
    </div>

    <div className={fullWidthCls + ' mb-[24px] min-[481px]:mb-[32px]'}>
      <label className={labelCls}>Special Requests</label>
      <textarea
        className={textareaCls}
        name="specialRequests"
        value={formData.specialRequests || ''}
        onChange={onInputChange}
        placeholder="Any special requirements or requests..."
        rows="4"
      />
    </div>

    <div className={summaryCls}>
      {/* cost estimate hidden -- payments & deals handled offline */}
      <button type="submit" disabled={submitting} className={submitBtnCls}>
        {submitting ? 'Submitting...' : 'Submit Tour Request'}
      </button>
    </div>
  </form>
);

const VisaForm = ({ formData, onInputChange, onSubmit, submitting, calculateCost }) => (
  <form onSubmit={onSubmit} className={formCls}>
    <div className={formHeaderCls}>
      <i className={`fas fa-passport ${formHeaderIconCls}`}></i>
      <h2 className={formHeaderTitleCls}>Visa Application</h2>
      <p className={formHeaderSubCls}>Get assistance with your visa application process</p>
    </div>

    <div className={gridCls}>
      <div className={groupCls}>
        <label className={labelCls}>Destination Country</label>
        <input
          className={fieldCls}
          type="text"
          name="country"
          value={formData.country || ''}
          onChange={onInputChange}
          placeholder="Country you want to visit"
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Visa Type</label>
        <select className={fieldCls} name="visaType" value={formData.visaType || 'tourist'} onChange={onInputChange}>
          <option value="tourist">Tourist Visa</option>
          <option value="business">Business Visa</option>
          <option value="student">Student Visa</option>
          <option value="work">Work Visa</option>
          <option value="transit">Transit Visa</option>
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Purpose of Travel</label>
        <select className={fieldCls} name="purpose" value={formData.purpose || 'tourism'} onChange={onInputChange}>
          <option value="tourism">Tourism</option>
          <option value="business">Business</option>
          <option value="education">Education</option>
          <option value="work">Work</option>
          <option value="family">Family Visit</option>
          <option value="medical">Medical Treatment</option>
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Intended Duration</label>
        <select className={fieldCls} name="duration" value={formData.duration || ''} onChange={onInputChange} required>
          <option value="">Select duration</option>
          <option value="1-7 days">1-7 days</option>
          <option value="1-2 weeks">1-2 weeks</option>
          <option value="2-4 weeks">2-4 weeks</option>
          <option value="1-3 months">1-3 months</option>
          <option value="3-6 months">3-6 months</option>
          <option value="6+ months">6+ months</option>
        </select>
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Intended Travel Date</label>
        <input
          className={fieldCls}
          type="date"
          name="travelDate"
          value={formData.travelDate || ''}
          onChange={onInputChange}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className={groupCls}>
        <label className={labelCls}>Processing Urgency</label>
        <select className={fieldCls} name="urgency" value={formData.urgency || 'regular'} onChange={onInputChange}>
          <option value="regular">Regular (15-20 days)</option>
          <option value="urgent">Urgent (7-10 days)</option>
          <option value="express">Express (3-5 days)</option>
        </select>
      </div>
    </div>

    <div className={fullWidthCls + ' mb-[24px] min-[481px]:mb-[32px]'}>
      <label className={labelCls}>Special Requests or Additional Information</label>
      <textarea
        className={textareaCls}
        name="specialRequests"
        value={formData.specialRequests || ''}
        onChange={onInputChange}
        placeholder="Any additional information or special requirements..."
        rows="4"
      />
    </div>

    <div className={summaryCls}>
      {/* Service fee removed -- payments & deals handled offline. */}
      <button type="submit" disabled={submitting} className={submitBtnCls}>
        {submitting ? 'Submitting...' : 'Submit Visa Request'}
      </button>
    </div>
  </form>
);

// Static initial states - these never change
const INITIAL_STATES = {
  flights: {
    type: 'flight',
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    class: 'economy',
    tripType: 'roundtrip',
    specialRequests: ''
  },
  hotels: {
    type: 'hotel',
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
    roomType: 'standard',
    specialRequests: ''
  },
  tours: {
    type: 'tour',
    destination: '',
    tourType: 'cultural',
    startDate: '',
    endDate: '',
    participants: 1,
    accommodation: 'standard',
    activities: [],
    specialRequests: ''
  },
  visa: {
    type: 'visa',
    country: '',
    visaType: 'tourist',
    purpose: 'tourism',
    duration: '',
    travelDate: '',
    urgency: 'regular',
    specialRequests: ''
  }
};

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { submitBooking, bookings, loading } = useBooking();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'flights');
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form data only once when component mounts or tab changes
  useEffect(() => {
    setFormData(INITIAL_STATES[activeTab] || {});
  }, [activeTab]);

  // Stable handleInputChange function
  const handleInputChange = React.useCallback((e) => {
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
  }, []);

  // Stable cost calculation function
  const calculateEstimatedCost = React.useCallback((data) => {
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
      default:
        baseCost = 0;
    }

    return Math.round(baseCost);
  }, []);

  // Stable submit function
  const handleSubmit = React.useCallback(async (e) => {
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

      // Reset form to initial state for current tab
      setFormData(INITIAL_STATES[activeTab]);

      toast.success('Booking request submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit booking request');
      console.error('Booking submission error:', error);
    } finally {
      setSubmitting(false);
    }
  }, [formData, activeTab, submitBooking, calculateEstimatedCost]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      {/* Header */}
      <header className="mt-5 max-w-[95%] mx-auto bg-gradient-to-br from-[#f59e0b] to-[#b45309] text-white rounded-2xl p-8">
        <div className="max-w-[1280px] mx-auto flex max-[768px]:flex-col min-[769px]:flex-row items-center justify-between gap-[12px] min-[481px]:gap-[16px] min-[769px]:gap-0">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-[8px] py-[12px] px-[24px] bg-white/15 text-[var(--color-btn-primary-text)] rounded-[8px] font-medium cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-[10px] border border-white/20 hover:bg-white/25 hover:-translate-y-[1px]">
            <i className="fas fa-arrow-left"></i>
            <span className="max-[480px]:hidden">Back to Dashboard</span>
          </button>

          <div>
            <h1 className="text-[20px] min-[481px]:text-[24px] min-[769px]:text-[30px] font-[600] mb-[8px] text-center">New Booking Request</h1>
            <p className="opacity-90 text-[14px] min-[769px]:text-[18px] m-0 text-center">Choose your service and fill out the booking form</p>
          </div>

          {isAdmin && (
            <button onClick={() => navigate('/admin')} className="flex items-center gap-[8px] py-[12px] px-[24px] bg-white/15 text-[var(--color-btn-primary-text)] rounded-[8px] font-medium cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-[10px] border border-white/20 hover:bg-white/25 hover:-translate-y-[1px]">
              <i className="fas fa-cog"></i>
              <span className="max-[480px]:hidden">Admin Panel</span>
            </button>
          )}
        </div>
      </header>

      {/* Booking Tabs */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-[12px] min-[481px]:px-[16px] min-[769px]:px-[32px] mt-5">
        <div className="max-w-[1280px] mx-auto flex gap-[8px] max-[768px]:overflow-x-auto max-[768px]:pb-[8px]">
          {[
            { id: 'flights', label: 'Flights', icon: 'fas fa-plane' },
            { id: 'hotels', label: 'Hotels', icon: 'fas fa-bed' },
            { id: 'tours', label: 'Tours', icon: 'fas fa-map-marked-alt' },
            { id: 'visa', label: 'Visa', icon: 'fas fa-passport' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`flex items-center gap-[12px] py-[12px] px-[16px] min-[481px]:py-[16px] min-[481px]:px-[24px] border-none font-medium cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] border-b-[3px] relative outline-none whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'text-[var(--color-primary)] border-b-[var(--color-primary)] bg-[var(--color-secondary)]'
                  : 'text-[var(--color-text-secondary)] border-b-transparent bg-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-secondary)]'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`${tab.icon} text-[20px]`}></i>
              <span className="max-[480px]:hidden">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Booking Forms */}
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 gap-[24px] p-[12px] min-[481px]:p-[16px] min-[769px]:p-[32px] min-[1201px]:grid-cols-[2fr_1fr] min-[1201px]:gap-[32px]">
        <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-card-border)] shadow-[var(--shadow-sm)] overflow-hidden">
          {activeTab === 'flights' && (
            <FlightForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              submitting={submitting}
              calculateCost={calculateEstimatedCost}
            />
          )}
          {activeTab === 'hotels' && (
            <HotelForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              submitting={submitting}
              calculateCost={calculateEstimatedCost}
            />
          )}
          {activeTab === 'tours' && (
            <TourForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              submitting={submitting}
              calculateCost={calculateEstimatedCost}
            />
          )}
          {activeTab === 'visa' && (
            <VisaForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              submitting={submitting}
              calculateCost={calculateEstimatedCost}
            />
          )}
        </div>

        {/* Recent Bookings Sidebar */}
        <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-card-border)] shadow-[var(--shadow-sm)] h-fit min-[1201px]:sticky min-[1201px]:top-[150px]">
          <div className="flex justify-between items-center p-[16px] min-[481px]:p-[24px] border-b border-[var(--color-card-border-inner)]">
            <h3 className="text-[var(--color-text)] text-[20px] font-[550] m-0">Your Recent Requests</h3>
            <span className="bg-[var(--color-secondary)] text-[var(--color-primary)] py-[4px] px-[12px] rounded-full text-[11px] font-[550]">{bookings.length} total</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-[24px] min-[481px]:p-[32px] text-center">
                <div className="w-[40px] h-[40px] border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin mb-[16px]"></div>
                <p>Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-[24px] min-[481px]:p-[32px] text-center">
                <i className="fas fa-clipboard-list text-[30px] text-[var(--color-text-secondary)] mb-[16px]"></i>
                <p className="text-[var(--color-text-secondary)] font-[550] mb-[8px]">No bookings yet</p>
                <span className="text-[var(--color-text-secondary)] text-[12px]">Your booking requests will appear here</span>
              </div>
            ) : (
              bookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="flex items-center gap-[16px] py-[12px] px-[16px] min-[481px]:py-[16px] min-[481px]:px-[24px] border-b border-[var(--color-card-border-inner)] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-secondary)] last:border-b-0">
                  <div className="w-[35px] h-[35px] min-[481px]:w-[40px] min-[481px]:h-[40px] rounded-[8px] bg-[var(--color-secondary)] text-[var(--color-primary)] flex items-center justify-center text-[16px] min-[481px]:text-[18px] shrink-0">
                    <i className={`fas fa-${
                      booking.type === 'flight' ? 'plane' :
                      booking.type === 'hotel' ? 'bed' :
                      booking.type === 'tour' ? 'map-marked-alt' : 'passport'
                    }`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[var(--color-text)] text-[12px] font-[550] mb-[4px] font-[family-name:var(--font-family-mono)]">{booking.id}</h4>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mb-[4px]">{booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}</p>
                    <span className={`${statusBaseCls} ${STATUS_CLS[booking.status] || ''}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-[var(--color-success)] font-[600] text-[12px]">
                    ₹{booking.estimatedCost || booking.finalCost || 0}
                  </div>
                </div>
              ))
            )}
          </div>

          {bookings.length > 5 && (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full p-[16px] bg-[var(--color-secondary)] text-[var(--color-primary)] border-none font-medium cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-secondary-hover)] hover:text-[var(--color-primary-hover)]"
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
