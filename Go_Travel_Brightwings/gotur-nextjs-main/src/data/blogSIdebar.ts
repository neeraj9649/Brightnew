// data.ts
// import blog1 from '@/assets/images/blog/lp-1-1.jpg';
// import blog2 from '@/assets/images/blog/lp-1-2.jpg';  
// import blog3 from '@/assets/images/blog/lp-1-3.jpg';

 const categories = [
     { label: 'Travel', count: 7 },
     { label: 'Agency', count: 4 },
     { label: 'Corporates', count: 5 },
     { label: 'Social Marketing', count: 3 },
     { label: 'System', count: 6 },
   ];
   
const recentPosts = [
     {
       title: 'Business Stagey For Marketing System',
       date: '14 Feb, 2024',
       image: '/images/blog/lp-1-1.jpg',
       link: 'blog-details-right',
     },
     {
       title: 'Design Better Links For Website & Emails',
       date: '12 Mar, 2024',
       image: '/images/blog/lp-1-2.jpg',
       link: 'blog-details-right',
     },
     {
       title: 'Web Frame Worsen Solve Vanilla Alte',
       date: '23 Feb, 2024',
       image: '/images/blog/lp-1-3.jpg',
       link: 'blog-details-right',
     },
   ];
   
   const tags = [
     { label: 'Agency' },
     { label: 'Traveling' },
     { label: 'Design' },
     { label: 'Travel' },
     { label: 'Change' },
     { label: 'Video' },
     { label: 'World' },
     { label: 'Startup' },
     { label: 'Services' }
   ];
   

   export const blogSidebarData = {
     categories,
     recentPosts,
     tags,
   };
   