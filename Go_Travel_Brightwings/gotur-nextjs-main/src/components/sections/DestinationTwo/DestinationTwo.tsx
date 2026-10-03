import destinationsTwoGridData from "@/data/destinationTwoGridData";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";

interface Destination {
  title: string;
  image: string;
  link: string;
  colorClass: string;
  wowDelay: string;
}
const DestinationTwo = () => {
  return (
    <section className='destination-two section-space'>
      <Container>
        <Row className='gutter-y-30 gutter-x-30'>
          {destinationsTwoGridData.map((item: Destination, index: number) => (
            <Col lg={4} md={6} sm={6} key={index}>
              <div
                className={`destination-card-two ${item.colorClass} wow fadeInUp`}
                data-wow-duration='1500ms'
                data-wow-delay={item.wowDelay}
              >
                <div className='destination-card-two__thumb'>
                  <Image src={item.image} alt={item.title} />
                  <Link
                    href={item.link}
                    className='destination-card-two__overly'
                  ></Link>
                </div>
                <div className='destination-card-two__content'>
                  <h3 className='destination-card-two__title'>
                    <Link href={item.link}>{item.title}</Link>
                  </h3>
                </div>
              </div>
            </Col>
          ))}

          {/* Pagination */}
          <Col xs={12}>
            <ul
              className='post-pagination justify-content-center wow fadeInUp'
              data-wow-duration='1500ms'
              data-wow-delay='500ms'
            >
              <li>
                <Link href='#' className='previous'>
                  Previous
                </Link>
              </li>
              <li>
                <Link href='#'>1</Link>
              </li>
              <li>
                <Link href='#'>2</Link>
              </li>
              <li>
                <Link href='#'>3</Link>
              </li>
              <li>
                <Link href='#'>...</Link>
              </li>
              <li className='active'>
                <Link href='#' className='next'>
                  Next
                </Link>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default DestinationTwo;
