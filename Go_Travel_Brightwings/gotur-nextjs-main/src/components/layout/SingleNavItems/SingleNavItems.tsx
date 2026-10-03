import React from "react";
import { Link } from "react-scroll";

interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: NavItem[];
}
interface SingleNavItemsProps {
  item: NavItem;
}
const SingleNavItems: React.FC<SingleNavItemsProps> = ({ item }) => {
  const handleClick = (e: any) => {
    if (item.link === "home") {
      e.preventDefault();
      window.scrollY; // Prevent default scrolling to top for Home
    }
  };
  return (
    <li className="scrollToLink">
      <Link
        activeClass="current"
        to={item.link}
        spy={true}
        smooth={true}
        offset={-20} // Adjust according to your layout
        duration={800}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      >
        {item.title}
      </Link>
    </li>
  );
};

export default SingleNavItems;
