"use client";
import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { productDetails } from "@/data/productsDetailsData";
import Link from "next/link";
import "./photoswipe-custom.css";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
interface Review {
  name: string;
  date: string;
  rating: number;
  text: string;
  image: string;
}

interface ProductDetails {
  name: string;
  price: number;
  description: string;
  description2: string;
  description3: string;
  defultQuantity: number;
  image: string;
  reviews: Review[];
}
const ProductDetails: React.FC = () => {
  const {
    name,
    price,
    description,
    description2,
    description3,
    defultQuantity,
    image,
    reviews,
  }: ProductDetails = productDetails;
  const [quantity, setQuantity] = useState(defultQuantity);

  const handleQuantityChange = (action: "increase" | "decrease") => {
    if (action === "increase") {
      setQuantity(quantity + 1);
    } else if (action === "decrease" && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");
    console.log("Form Submitted:", { name, email, message });
  };
  return (
    <section className='product-details section-space'>
      <Container>
        <Row className='gutter-y-30 align-items-center'>
          <Col lg={6} xl={6}>
            <PhotoSwipeGallery>
              <div
                className='product-details__img wow fadeInLeft'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
              >
                <Image src={image} alt={name} layout='responsive' />
                <div className='product-details__img-search'>
                  <Item
                    original={image}
                    thumbnail={image}
                    width='500'
                    height='500'
                  >
                    {({ ref, open }) => (
                      <Link
                        className='img-popup'
                        href='#'
                        ref={ref}
                        onClick={(e) => {
                          e.preventDefault();
                          open(e);
                        }}
                      >
                        <span className='icon-search'></span>
                      </Link>
                    )}
                  </Item>
                </div>
              </div>
            </PhotoSwipeGallery>
          </Col>
          <Col lg={6} xl={6}>
            <div className='product-details__content'>
              <div
                className='product-details__top wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
              >
                <h3 className='product-details__title'>{name}</h3>
                <div className='product-details__price'>${price}</div>
              </div>
              <div
                className='product-details__review wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
              >
                <span className='fa fa-star'></span>
                <span className='fa fa-star'></span>
                <span className='fa fa-star'></span>
                <span className='fa fa-star'></span>
                <span className='fa fa-star'></span>
                <Link href='product-details'>
                  ({reviews.length} customer reviews)
                </Link>
              </div>
              <div className='product-details__divider'></div>
              <div
                className='product-details__excerpt wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
              >
                <p className='product-details__excerpt-text1'>{description}</p>
              </div>
              <div
                className='product-details__quantity wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
              >
                <h3 className='product-details__quantity-title'>Quantity</h3>
                <div className='quantity-box'>
                  <button
                    className='sub'
                    onClick={() => handleQuantityChange("decrease")}
                  >
                    <i className='fa fa-minus'></i>
                  </button>
                  <input type='text' id='1' value={quantity} readOnly />
                  <button
                    className='add'
                    onClick={() => handleQuantityChange("increase")}
                  >
                    <i className='fa fa-plus'></i>
                  </button>
                </div>
              </div>
              <div
                className='product-details__buttons wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
              >
                <Link href='cart' className='gotur-btn gotur-btn--base'>
                  ADD TO CART{" "}
                  <span className='product-details__buttons__icon'>
                    <i className='icon-shopping-carts'></i>
                  </span>
                </Link>
                <Link href='cart' className='gotur-btn'>
                  ADD TO WISHLIST
                </Link>
              </div>
              <div
                className='product-details__socials wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
              >
                <h4 className='product-details__socials__title'>
                  share with friends :
                </h4>
                <Link href='https://facebook.com'>
                  <i className='icon-facebook' aria-hidden='true'></i>
                  <span className='sr-only'>Facebook</span>
                </Link>
                <Link href='https://twitter.com'>
                  <i className='icon-twitter' aria-hidden='true'></i>
                  <span className='sr-only'>Twitter</span>
                </Link>
                <Link href='https://instagram.com'>
                  <i className='icon-linkedin' aria-hidden='true'></i>
                  <span className='sr-only'>Linked In</span>
                </Link>
                <Link href='https://youtube.com'>
                  <i className='icon-youtube' aria-hidden='true'></i>
                  <span className='sr-only'>Youtube</span>
                </Link>
              </div>
            </div>
          </Col>
        </Row>

        {/* Product Description */}
        <div className='product-details__description'>
          <h3
            className='product-details__description__title wow fadeInUp'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            Product Description
          </h3>
          <p
            className='product-details__description__text wow fadeInUp'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            {description2}
          </p>
          <p
            className='product-details__description__text wow fadeInUp'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            {description3}
          </p>
        </div>

        {/* Product Reviews */}
        <div className='product-details__comment'>
          <h3
            className='product-details__comment-title wow fadeInUp'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            {reviews.length} Reviews
          </h3>
          <ul className='list-unstyled product-details__comment__list'>
            {reviews.map((review, index) => (
              <li
                className='product-details__comment__card wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='500ms'
                key={index}
              >
                <div className='product-details__comment__card__image'>
                  <Image src={review.image} alt={review.name} />
                </div>
                <div className='product-details__comment__card__content'>
                  <div className='product-details__comment__card__top'>
                    <div className='product-details__comment__card__info'>
                      <h3 className='product-details__comment__card__title'>
                        {review.name}
                      </h3>
                      <p className='product-details__comment__card__date'>
                        {review.date}
                      </p>
                    </div>
                    <div className='product-details__comment__card__star'>
                      {[...Array(review.rating)].map((_, index) => (
                        <span key={index} className='fa fa-star'></span>
                      ))}
                    </div>
                  </div>
                  <p className='product-details__comment__card__text'>
                    {review.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Add Review Form */}
        <div
          className='product-details__form wow fadeInUp'
          data-wow-delay='500ms'
        >
          <h3 className='product-details__form-title'>Add a Review</h3>
          <p className='product-details__form-text'>
            Your email address will not be published. Required fields are marked
            *
          </p>
          <div className='product-details__form-ratings'>
            <p className='product-details__form-ratings__label'>
              Rate this product? *
            </p>
            {[...Array(5)].map((_, index) => (
              <span key={index} className='far fa-star'></span>
            ))}
          </div>
          <Form
            className='comments-form__form contact-form-validated product-details__form__form form-one'
            onSubmit={handleSubmit}
          >
            <div className='form-one__group'>
              <Form.Group>
                <Form.Control type='text' name='name' placeholder='Your Name' />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  type='email'
                  name='email'
                  placeholder='Your Email'
                />
              </Form.Group>
              <Form.Group className='form-one__control--full'>
                <Form.Control
                  as='textarea'
                  name='message'
                  placeholder='Write Message...'
                />
              </Form.Group>
              <div className='form-one__control--full'>
                <Button type='submit' className='gotur-btn gotur-btn--base'>
                  Post Comment
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </Container>
    </section>
  );
};

export default ProductDetails;
