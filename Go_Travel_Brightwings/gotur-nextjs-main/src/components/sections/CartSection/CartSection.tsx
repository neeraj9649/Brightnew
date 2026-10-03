"use client";
import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";
import { cartItems as initialCartItems, couponSection } from "@/data/cartData";

// Interfaces for the types
interface CartItem {
  id: number;
  image: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
}

interface CouponSection {
  placeholder: string;
}

const CartSection: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

  const handleIncreaseQuantity = (id: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
              total: (item.quantity + 1) * item.price,
            }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (id: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.quantity > 1
          ? {
              ...item,
              quantity: item.quantity - 1,
              total: (item.quantity - 1) * item.price,
            }
          : item
      )
    );
  };

  const calculateTotal = (): string => {
    return cartItems.reduce((acc, item) => acc + item.total, 0).toFixed(2);
  };

  return (
    <section className='cart-page'>
      <Container>
        <div className='table-responsive'>
          <table className='table cart-page__table'>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Sub total</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className='cart-page__table__meta'>
                      <div className='cart-page__table__meta-img'>
                        <Image src={item.image} alt={item.title} width={100} height={100}/>
                      </div>
                      <h3 className='cart-page__table__meta-title'>
                        <Link href='/product-details'>{item.title}</Link>
                      </h3>
                    </div>
                  </td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <div className='product-details__quantity'>
                      <div className='quantity-box'>
                        <button
                          type='button'
                          className='sub'
                          onClick={() => handleDecreaseQuantity(item.id)}
                        >
                          <i className='fa fa-minus'></i>
                        </button>
                        <input type='text' value={item.quantity} readOnly />
                        <button
                          type='button'
                          className='add'
                          onClick={() => handleIncreaseQuantity(item.id)}
                        >
                          <i className='fa fa-plus'></i>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>${item.total.toFixed(2)}</td>
                  <td>
                    <Link
                      href='cart'
                      className='table cart-page__table__remove'
                    >
                      <span className='fas fa-times'></span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Row>
          <Col xs={12}>
            <div className='cart-page__coupone'>
              <h5 className='cart-page__coupone__title'>Coupon:</h5>
              <div className='cart-page__coupone__box'>
                <form action='#' className='cart-page__coupone__form'>
                  <input
                    type='text'
                    placeholder={couponSection.placeholder}
                    className='cart-cupon__coupone__input'
                  />
                  <button type='submit' className='gotur-btn gotur-btn--base'>
                    Apply code
                  </button>
                </form>
                <Link
                  href='cart'
                  className='cart-page__coupone__box__btn gotur-btn'
                >
                  update cart
                </Link>
              </div>
            </div>
          </Col>
          <Col xs={12}>
            <div className='cart-page__coupone__list'>
              <h3 className='cart-page__cart-total__title'>Subtotal</h3>

              <ul className='cart-page__cart-total list-unstyled'>
                <li className='cart-page__cart-total__item'>
                  <span>Subtotal</span>
                  <span className='cart-page__cart-total-amount'>
                    ${calculateTotal()}
                  </span>
                </li>
                <li className='cart-page__cart-total__item'>
                  Shipping Address
                </li>
                <li className='cart-page__cart-total__item'>
                  <p className=''>
                    2801 Lafayette Blvd, Norfolk, Vermont 23509, united state
                  </p>
                </li>
                <li className='cart-page__cart-total__item'>
                  <span>Total</span>
                  <span className='cart-page__cart-total-amount'>
                    ${calculateTotal()}
                  </span>
                </li>
              </ul>
            </div>

            <div className='cart-page__buttons'>
              <Link href='/checkout' className='gotur-btn gotur-btn--base'>
                Checkout
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default CartSection;
