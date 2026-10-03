"use client";

import useStore from "@/store/useStore";
import React, { useEffect, useState, FormEvent } from "react";

const Search: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const {
    changeSearchPopupStatus,
    changeMobileDrawerStatus,
    changeSideBarDrawerStatus,
    searchPopupStatus,
  } = useStore();
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log(formData.get("search"));
    changeSearchPopupStatus();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`search-popup ${searchPopupStatus ? " active" : ""}`}>
      <div
        onClick={(e) => {
          e.preventDefault();
          changeSearchPopupStatus();
        }}
        className='search-popup__overlay search-toggler'
      ></div>

      <div className='search-popup__content'>
        <form onSubmit={handleSearch} className='search-popup__form' action='#'>
          <input
            type='text'
            id='search'
            name='search'
            placeholder='Search Here...'
          />
          <button
            type='submit'
            aria-label='search submit'
            className='gotur-btn'
          >
            <i className='icon-search'></i>

            <span></span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Search;
