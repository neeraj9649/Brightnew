"use client";
import CustomSelect from "@/components/common/CustomSelect/CustomSelect";
import DateRangePicker from "@/components/common/DateRangePicker/DateRangePicker";
import { tourListingOneLeftData } from "@/data/tourListingOneLeftData";
import React, { useState } from "react";
import dayjs, { Dayjs } from "dayjs";

const BannerForm: React.FC = () => {
  const [location, setLocation] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [guests, setGuests] = useState<number>(2);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs(),
    dayjs(),
  ]);

  // Handle increment and decrement
  const incrementGuests = () => {
    setGuests(guests + 1);
  };

  const decrementGuests = () => {
    if (guests > 1) {
      // Prevent going below 1
      setGuests(guests - 1);
    }
  };
  const handleLocationChange = (selectedOption: any) => {
    setLocation(selectedOption);
  };

  const handleActivityChange = (selectedOption: any) => {
    setActivity(selectedOption);
  };
  const handleSubmit = (e: any) => {
    e.preventDefault();
    const data = {
      location,
      activity,
      guests,
      dateRange,
    };
    console.log(data, "Data");
  };
  return (
    <div
      className='banner-form wow fadeInUp'
      data-wow-duration='1500ms'
      data-wow-delay='300ms'
    >
      <div className='container'>
        <form className='banner-form__wrapper' onSubmit={handleSubmit}>
          <div className='banner-form row gutter-x-30 align-items-center'>
            
            <div className='banner-form__control banner-form__col--1'>
              <i className='icon icon-location'></i>
              <label htmlFor='location'>Location</label>
              <CustomSelect
                options={tourListingOneLeftData.locations}
                placeholder='Choose a Location'
                onChange={handleLocationChange}
              />
            </div>

            <div className='banner-form__control banner-form__col--2'>
              <i className='icon icon-travle'></i>
              <label htmlFor='type2'>Activities Type</label>
              <CustomSelect
                options={tourListingOneLeftData.activities}
                placeholder='Adventure'
                onChange={handleActivityChange}
              />
            </div>
            <div className='banner-form__control banner-form__control--date banner-form__col--3'>
              <i className='icon icon-clock'></i>
              <label htmlFor='date'>Activate Day</label>
              <DateRangePicker
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </div>
            <div className='banner-form__control banner-form__col--4'>
              <i className='icon icon-group'></i>
              <label htmlFor='guests'>Traveler</label>
              <button
                type='button'
                className='banner-form__qty-minus sub'
                onClick={decrementGuests}
              >
                <i className='icon-down-arrow'></i>
              </button>
              <input
                id='guests'
                type='number'
                name='guests'
                placeholder='2'
                value={guests}
                readOnly
              />
              <button
                type='button'
                className='banner-form__qty-plus add'
                onClick={incrementGuests}
              >
                <i className='icon-down-arrow'></i>
              </button>
            </div>
            <div className='banner-form__control banner-form__button banner-form__col--5'>
              <button className='gotur-btn gotur-btn--primary' type='submit'>
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerForm;
