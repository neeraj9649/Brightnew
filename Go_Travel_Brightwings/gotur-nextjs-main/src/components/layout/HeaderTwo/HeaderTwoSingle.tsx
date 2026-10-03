"use client";
import React from "react";
import Image from "next/image";

import { navItems, headerTwoNavItems } from "@/data/navItems"; // Import the navItems data
import DemoPages from "@/components/common/DemoPages/DemoPages";
import main_logo from "/images/logo-dark.png";
import { usePathname } from "next/navigation";
import useStore from "@/store/useStore";

import SingleNavItems from "../SingleNavItems/SingleNavItems";
import Link from "next/link";
interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: NavItem[];
}

const HeaderTwoSingle: React.FC = () => {
  const pathname = usePathname();
  const {
    changeSearchPopupStatus,
    changeMobileDrawerStatus,
    changeSideBarDrawerStatus,
  } = useStore();
  const renderSubMenu = (subMenu: NavItem[]) => (
    <ul className=''>
      {subMenu.map((item: any, index: number) => (
        <li key={index} className={item.subMenu ? "dropdown" : ""}>
          <Link href={item.link}>{item.title}</Link>
          {item.subMenu && renderSubMenu(item.subMenu)}
        </li>
      ))}
    </ul>
  );
  const handelClick = () => {
    changeMobileDrawerStatus();
    console.log("clicked");
  };

  return (
    <header className='main-header main-header--two sticky-header sticky-header--normal'>
      <div className='container-fluid'>
        <div className='main-header__inner'>
          <div className='main-header__logo logo-retina'>
            <Link href='/'>
              <Image
                src={'/images/logo-dark.png'}
                alt='Brightwings logo'
                width='160'
                height='45'
              />
            </Link>
          </div>

          <nav className='main-header__nav main-menu'>
            <ul className='main-menu__list one-page-scroll-menu'>
              {/* Render Home menu with showcase */}
              <li className='dropdown megamenu scrollToLink'>
                <Link href='home'>Home</Link>
                <DemoPages />
              </li>

              {headerTwoNavItems.map((item: NavItem) => (
                <SingleNavItems key={item.id} item={item} />
              ))}
            </ul>
          </nav>
          <div className='main-header__right'>
            <div className='main-header__info'>
              <Link
                onClick={(e) => {
                  e.preventDefault();
                  changeSearchPopupStatus();
                }}
                href='#'
                className='search-toggler main-header__info__item'
              >
                <i
                  className='icon-search-interface-symbol'
                  aria-hidden='true'
                ></i>
                <span className='sr-only'>Search</span>
              </Link>
              <Link href='cart' className='main-header__info__item'>
                <i className='icon-shopping-carts' aria-hidden='true'></i>
                <span className='sr-only'>Cart</span>
              </Link>
            </div>

            <Link href='contact' className='gotur-btn main-header__btn'>
              Get in touch <i className='icon-paper-plane'></i>
            </Link>
            <div className='main-header__call'>
              <div className='main-header__call__icon'>
                <i className='icon-telephone'></i>
              </div>
              <div className='main-header__call__content'>
                <span className='main-header__call__subtitle'>Call Us Now</span>
                <Link href='tel:+917732957732'>+91 7732957732</Link>
              </div>
            </div>
            <div
              className='mobile-nav__btn mobile-nav__toggler'
              onClick={handelClick}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          {/*  
             <div className="main-header__btn-popup main-header__element__btn" onClick={changeSideBarDrawerStatus}>
               <i className="icon-menu-bar"></i>
             </div>
 
             <Link href="contact" className="gotur-btn main-header__btn">
               Get in touch <i className="icon-paper-plane"></i>
             </Link> */}
        </div>
      </div>
    </header>
  );
};

export default HeaderTwoSingle;
