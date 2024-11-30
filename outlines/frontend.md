# Frontend Outlines

## Development Guidelines
* Place styles into static/styles.css
* Don't use any client size JS for components in the compontents/ directory


## UI Specifications
* Responsive design
* Use a nav bar as a server component using only HTML and CSS/tailwind
* Render navbar as a hamburger menu in mobile
* Use a footer as a server component using only HTML and CSS/tailwind

### Navbar
* Links to home
* A drop-down menu for example pages
* A drop-down menu for outline pages generated based on the contents of the outlines/ folder
* Links to login and signup if not logged in, otherwise link to logout

### Footer
* Links to privacy policy and terms of service
* Links to contact us
* Links to social media

## Pages
* Home page - /index.tsxrenders markdown from README.md
* Outline page - /routes/outline/[name].tsx - renders markdown from the corresponding file in outlines/ folder
