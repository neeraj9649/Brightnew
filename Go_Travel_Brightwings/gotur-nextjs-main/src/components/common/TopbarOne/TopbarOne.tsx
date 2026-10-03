"use client";

import React from "react";
import { Container } from "react-bootstrap";
import { topbarOne } from "@/data/topbarOne";

import LanguageSelector from "../LanguageSelector/LanguageSelector";
import Link from "next/link";

interface ContactInfoItem {
  type: string;
  iconClass: string;
  label: string;
  href: string;
}
interface ContactInfoItemTwo {
  type: string;
  iconClass: string;
  label: string;
  href: string;
}

interface AddressInfo {
  iconClass: string;
  label: string;
  href: string;
}

interface SocialLink {
  platform: string;
  iconClass: string;
  href: string;
}

interface TopbarOneData {
  contactInfo: ContactInfoItem[];
  contactInfoTwo: ContactInfoItemTwo[];
  address: AddressInfo;
  socialLinks: SocialLink[];
}
interface TopbarOneProps {
  extraClass?: string;
}

const TopbarOne: React.FC<TopbarOneProps> = ({ extraClass }) => {
  const { contactInfo, contactInfoTwo, address, socialLinks }: TopbarOneData =
    topbarOne;
  return (
    <div className={`top-one ${extraClass || ""}`}>
      <Container fluid>
        <div className='top-one__inner'>
          {/* Contact Info */}
          <ul className='list-unstyled top-one__info'>
            {extraClass === "top-one--two"
              ? contactInfo.map((item: ContactInfoItem, index) => (
                  <li className='top-one__info__item special' key={index}>
                    <i className={item.iconClass}></i>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))
              : contactInfoTwo.map((item: ContactInfoItemTwo, index) => (
                  <li className='top-one__info__item' key={index}>
                    <i className={item.iconClass}></i>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
          </ul>

          <div className='top-one__right'>
            {/* Address Section */}
            {extraClass === "top-one--two" ? (
              <div className='top-one__info__item'>
                <i className={address.iconClass}></i>
                <Link href={address.href}>{address.label}</Link>
              </div>
            ) : (
              <LanguageSelector />
            )}

            {/* Social Links Section */}
            <div className='top-one__social'>
              {socialLinks.map((social: SocialLink, index) => (
                <Link href={social.href} key={index}>
                  <i className={social.iconClass} aria-hidden='true'></i>
                  <span className='sr-only'>{social.platform}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TopbarOne;
