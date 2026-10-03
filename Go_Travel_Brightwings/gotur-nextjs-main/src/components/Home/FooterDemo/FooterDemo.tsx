import { footerDemoData } from "@/data/FooterDemo";

import Link from "next/link";
import { Container } from "react-bootstrap";

const FooterDemo = () => {
  const { title, text, button, copyright } = footerDemoData;

  const year = new Date().getFullYear();

  return (
    <footer className='main-footer'>
      <Container className='text-center'>
        <h2 className='main-footer__title'>{title}</h2>
        <p className='main-footer__text'>{text}</p>
        <Link
          href={button.href}
          rel={button.rel}
          target={button.target}
          className='gotur-btn'
        >
          {button.text}
        </Link>
      </Container>

      <Container>
        <div className='main-footer__copyright text-center'>
          <p>
            © Copyright <span className='dynamic-year'>{year}</span>{" "}
            {copyright.text}
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default FooterDemo;
