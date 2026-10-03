import Link from 'next/link';
import React from 'react';

const Pagination: React.FC = () => {
    return (
        <ul
                  className='post-pagination justify-content-center'
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
    );
};

export default Pagination;