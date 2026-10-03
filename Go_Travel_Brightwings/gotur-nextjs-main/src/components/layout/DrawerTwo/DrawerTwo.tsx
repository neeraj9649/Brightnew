"use client";
import React, { useState } from "react";
import useStore from "@/store/useStore";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
// import logo from "/images/logo-light.png";
import { navItems } from "@/data/navItems";
// import { demoPages } from "@/data/demoPages";
import MegaMenu from "@/components/common/MegaMenu/MegaMenu";

interface SubMenu {
  id: number;
  title: string;
  link?: string;
  subMenu?: SubMenu[];
}

interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: SubMenu[];
}

interface Page {
  image: StaticImageData;
  title: string;
  isNew?: boolean;
  multiPageLink?: string;
  onePageLink?: string;
  darkPageLink?: string;
  viewPageLink?: string;
}

const DrawerTwo: React.FC = () => {
  const [isMegaMenu, setIsMegaMenu] = useState<boolean>(false);

  const [isHomeDrop, setIsHomeDrop] = useState(false);
  const { mobileDrawerTwoStatus, changeMobileDrawerTwoStatus } = useStore();
  const [isItems, setIsItems] = useState<number | null>(null);
  const [isSubItems, setIsSubItems] = useState<number | null>(null);
  const [openNavItemId, setOpenNavItemId] = useState<number | null>(null);
  const [openSubItemId, setOpenSubItemId] = useState<number | null>(null);
  const toggleDropdown = (itemId: number) => {
    setIsItems((prevItem) => (prevItem === itemId ? null : itemId));
    setOpenNavItemId((prev) => (prev === itemId ? null : itemId));

    console.log(itemId);
  };

  const toggleSubItemDropdown = (subItemId: number) => {
    setIsSubItems((prevSubItem) =>
      prevSubItem === subItemId ? null : subItemId
    );
    setOpenSubItemId((prev) => (prev === subItemId ? null : subItemId));
  };

  const toggleMegaMenu = () => {
    setIsMegaMenu(!isMegaMenu);
  };
  const toggleHomeDrop = () => {
    setIsHomeDrop(!isMegaMenu);
  };

  return (
    <div
      className={`mobile-nav__wrapper ${
        mobileDrawerTwoStatus ? "expanded" : ""
      }`}
    >
      <div
        className='mobile-nav__overlay'
        onClick={changeMobileDrawerTwoStatus}
      ></div>
      <div className={`mobile-nav__content `}>
        <span
          className='mobile-nav__close'
          onClick={changeMobileDrawerTwoStatus}
        >
          <i className='fa fa-times'></i>
        </span>

        <div className='logo-box'>
          <Link href='/' aria-label='logo image'>
            <img src={'/images/logo-light.png'} width={155} height={41} alt='logo' />
          </Link>
        </div>

        <div className='mobile-nav__container'>
          <ul className='main-menu__list'>
            <li
              className={`megamenu megamenu megamenu-clickable megamenu-clickable--toggle `}
            >
              <Link
                href='/'
                // onClick={(e) => {
                //   e.preventDefault();
                //   setIsMegaMenu(!isMegaMenu);
                // }}
                onClick={() => changeMobileDrawerTwoStatus()}
              >
                Home
              </Link>
              <MegaMenu setIsMegaMenu={setIsMegaMenu} isMegamenu={isMegaMenu} />
            </li>

            {navItems.map((item: NavItem) => (
              <li
                key={item.id}
                className={`${item.subMenu ? "dropdown" : ""} ${
                  isItems === item.id ? "open" : ""
                }`}
              >
                <Link
                  href={item.link || "#"}
                  className={`${isItems === item.id ? "expanded" : ""}`}
                  onClick={() => changeMobileDrawerTwoStatus()}
                >
                  {item.title}
                  {item.subMenu && (
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className={`${isItems === item.id ? "expanded" : ""}`}
                    >
                      <i className='fa fa-angle-down'></i>
                    </button>
                  )}
                </Link>

                <ul
                  className={`close ${openNavItemId === item.id ? "open" : ""}`}
                >
                  {item.subMenu?.map((subMenu: SubMenu) => (
                    <li
                      key={subMenu.id}
                      className={`${subMenu.subMenu ? "dropdown" : ""} ${
                        isSubItems === subMenu.id ? "open" : ""
                      }`}
                    >
                      <div className=' main-menu__list__wrapper'>
                        <Link
                          href={subMenu.link || "#"}
                          className={`${
                            isSubItems === subMenu.id ? "expanded" : ""
                          }`}
                        >
                          {subMenu.title}{" "}
                        </Link>
                        {subMenu.subMenu && (
                          <button
                            onClick={() => toggleSubItemDropdown(subMenu.id)}
                            className={`${
                              isSubItems === subMenu.id ? "expanded" : ""
                            }`}
                          >
                            <i className='fa fa-angle-down'></i>
                          </button>
                        )}
                      </div>

                      <ul
                        className={`close ${
                          openSubItemId === subMenu.id ? "open" : ""
                        }`}
                      >
                        {subMenu.subMenu?.map((subSubItem: SubMenu) => (
                          <li key={subSubItem.id}>
                            <Link href={subSubItem.link || "#"}>
                              {subSubItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <ul className='mobile-nav__contact list-unstyled'>
          <li>
            <span className='mobile-nav__contact__icon'>
              <i className='fa fa-envelope'></i>
            </span>
            <Link href='mailto:info@brightwingstravel.com'>Info@brightwingstravel.com</Link>
          </li>
          <li>
            <span className='mobile-nav__contact__icon'>
              <i className='fa fa-phone-alt'></i>
            </span>
            <Link href='tel:+917732957732'>+91 7732957732</Link>
          </li>
        </ul>

        <div className='mobile-nav__social'>
          <Link href='https://www.facebook.com/BrightwingsTravelTourism/'>
            <i className='icon-facebook' aria-hidden='true'></i>
            <span className='sr-only'>Facebook</span>
          </Link>
          {/* <Link href='https://twitter.com'>
            <i className='icon-twitter' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Twitter</span>
          </Link> */}
          <Link href='https://www.instagram.com/brightwingstours/?hl=en'>
            <i className='fa fa-instagram' aria-hidden='true'></i>
            <span className='sr-only'>Instagram</span>
          </Link>
          {/* <Link href='https://youtube.com'>
            <i className='icon-youtube' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Youtube</span>
          </Link> */}
        </div>
      </div>
    </div>
  );
};

export default DrawerTwo;
