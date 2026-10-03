"use client";
import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import CustomSelect from "../CustomSelect/CustomSelect";
import { tourListingOneLeftData } from "@/data/tourListingOneLeftData";
import DatePicker from "react-datepicker"; // Date range picker
import Slider from "rc-slider";
const TourSidebar: React.FC = () => {
  const [location, setLocation] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState<number>(
    tourListingOneLeftData.travelerCount
  );
  const handleLocationChange = (selectedOption: any) => {
    setLocation(selectedOption);
  };

  const handleActivityChange = (selectedOption: any) => {
    setActivity(selectedOption);
  };

  const handleGuestChange = (type: string) => {
    setGuests((prev) => (type === "add" ? prev + 1 : prev - 1));
  };

  const [sliderValue, setSliderValue] = useState<number[]>([150, 300]);
  const handleSlideChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      setSliderValue([value[0], value[1]]);
    }
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission here
    console.log({
      location,
      activity,
      startDate,

      guests,
      sliderValue,
    });
  };

  return (
    <aside className='listing__sidebar'>
      <div className='listing__sidebar__item'>
        <Form
          action='#'
          className='listing__sidebar__form wow fadeInUp'
          data-wow-delay='0.4s'
          data-wow-duration='1500ms'
          onSubmit={handleSubmit}
        >
          <div className='banner-form'>
            {/* Location Dropdown */}
            <div className='banner-form__control'>
              <i className={tourListingOneLeftData.icons.location}></i>
              <label htmlFor='location'>Location</label>
              <CustomSelect
                options={tourListingOneLeftData.locations}
                placeholder='Choose a Location'
                onChange={handleLocationChange}
              />
            </div>

            {/* Activities Dropdown */}
            <div className='banner-form__control'>
              <i className={tourListingOneLeftData.icons.activity}></i>
              <label htmlFor='type'>Activities Type</label>
              <CustomSelect
                options={tourListingOneLeftData.activities}
                placeholder='Select Activity'
                onChange={handleActivityChange}
              />
            </div>

            {/* Date Range Picker */}
            <div className='banner-form__control banner-form__control--date'>
              <i className={tourListingOneLeftData.icons.calendar}></i>

              <label htmlFor='date'>Activate Day</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
              />
            </div>

            {/* Guests */}
            <div className='banner-form__control'>
              <i className={tourListingOneLeftData.icons.group}></i>
              <label htmlFor='guests'>Guests</label>
              <button
                type='button'
                className='banner-form__qty-minus sub'
                onClick={() => handleGuestChange("subtract")}
              >
                <i className='icon-down-arrow'></i>
              </button>
              <input id='guests' type='number' value={guests} readOnly />
              <button
                type='button'
                className='banner-form__qty-plus add'
                onClick={() => handleGuestChange("add")}
              >
                <i className='icon-down-arrow'></i>
              </button>
            </div>

            {/* Search Button */}
            <div className='banner-form__control banner-form__button'>
              <Button className='gotur-btn' type='submit'>
                Search
              </Button>
            </div>
          </div>
        </Form>
      </div>

      {/* Filter by Price */}
      <div
        className='listing__sidebar__item wow fadeInUp'
        data-wow-delay='0.4s'
        data-wow-duration='1500ms'
      >
        <div className='listing__sidebar__filter listing__sidebar__item__inner'>
          <h3 className='listing__sidebar__title'>Filter by Price</h3>
          <form action='' className='price-ranger-form'>
            <Slider
              range
              allowCross={false}
              value={sliderValue}
              onChange={handleSlideChange}
              max={500}
              min={50}
              handleRender={(node, handleProps) => {
                return React.cloneElement(node, {
                  children: (
                    <>
                      {node.props.children}
                      <div
                        className='value'
                        style={{ position: "absolute", top: -30 }}
                      >
                        ${handleProps.value}
                      </div>
                    </>
                  ),
                });
              }}
              className='range-slider-price'
              id='slider-range-two'
            />
          </form>
        </div>

        {/* Reviews Star */}
        <div className='listing__sidebar__rating listing__sidebar__item__inner'>
          <h3 className='listing__sidebar__title'>Reviews Star</h3>
          <ul className='list-unstyled'>
            <li>
              <div className='listing__sidebar__rating__check'>
                <input type='checkbox' name='check1' id='check1' />
                <label htmlFor='check1'></label>
              </div>
              <div className='listing__sidebar__rating__star'>
                <i className='fas fa-star' data-value='1'></i>
                <i className='fas fa-star' data-value='2'></i>
                <i className='fas fa-star' data-value='3'></i>
                <i className='fas fa-star' data-value='4'></i>
                <i className='fas fa-star' data-value='5'></i>
                <span>5 only</span>
              </div>
            </li>
            <li>
              <div className='listing__sidebar__rating__check'>
                <input type='checkbox' name='check2' id='check1' />
                <label htmlFor='check2'></label>
              </div>
              <div className='listing__sidebar__rating__star'>
                <i className='fas fa-star' data-value='1'></i>
                <i className='fas fa-star' data-value='2'></i>
                <i className='fas fa-star' data-value='3'></i>
                <i className='fas fa-star' data-value='4'></i>
                <i className='far fa-star' data-value='5'></i>
                <span>4 & up</span>
              </div>
            </li>
            <li>
              <div className='listing__sidebar__rating__check'>
                <input type='checkbox' name='check3' id='check1' />
                <label htmlFor='check3'></label>
              </div>
              <div className='listing__sidebar__rating__star'>
                <i className='fas fa-star' data-value='1'></i>
                <i className='fas fa-star' data-value='2'></i>
                <i className='fas fa-star' data-value='3'></i>
                <i className='far fa-star' data-value='4'></i>
                <i className='far fa-star' data-value='5'></i>
                <span>3 & up</span>
              </div>
            </li>
            <li>
              <div className='listing__sidebar__rating__check'>
                <input type='checkbox' name='check4' id='check1' />
                <label htmlFor='check4'></label>
              </div>
              <div className='listing__sidebar__rating__star'>
                <i className='fas fa-star' data-value='1'></i>
                <i className='fas fa-star' data-value='2'></i>
                <i className='far fa-star' data-value='3'></i>
                <i className='far fa-star' data-value='4'></i>
                <i className='far fa-star' data-value='5'></i>
                <span>2 & up</span>
              </div>
            </li>
            <li>
              <div className='listing__sidebar__rating__check'>
                <input type='checkbox' name='check5' id='check1' />
                <label htmlFor='check5'></label>
              </div>
              <div className='listing__sidebar__rating__star'>
                <i className='fas fa-star' data-value='1'></i>
                <i className='far fa-star' data-value='2'></i>
                <i className='far fa-star' data-value='3'></i>
                <i className='far fa-star' data-value='4'></i>
                <i className='far fa-star' data-value='5'></i>
                <span>1 & up</span>
              </div>
            </li>
          </ul>
        </div>
        <div className='listing__sidebar__amenitie listing__sidebar__item__inner'>
          <h3 className='listing__sidebar__title listing__sidebar__amenitie__title'>
            Amenities
          </h3>
          <ul className='list-unstyled'>
            <li>
              <input type='checkbox' name='check8' id='check8' />
              <label htmlFor='check8'>
                {" "}
                <span>Wireless Internet</span>
              </label>
            </li>
            <li>
              <input type='checkbox' name='check9' id='check9' />
              <label htmlFor='check9'>
                <span>Laundry Services</span>
              </label>
            </li>
            <li>
              <input type='checkbox' name='check10' id='check10' />
              <label htmlFor='check10'>
                <span>Car Parking</span>
              </label>
            </li>
            <li>
              <input type='checkbox' name='check11' id='check11' />
              <label htmlFor='check11'>
                <span>Reservations</span>
              </label>
            </li>
            <li>
              <input type='checkbox' name='check12' id='check12' />
              <label htmlFor='check12'>
                <span>Free Coupons</span>
              </label>
            </li>
            <li>
              <input type='checkbox' name='check13' id='check13' />
              <label htmlFor='check13'>
                <span>Smoking Not Allowed</span>
              </label>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default TourSidebar;
