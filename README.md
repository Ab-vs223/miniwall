# MiniWall SaaS API

**CSM020 - Cloud Computing Coursework**
**University of London**
**April 2026**

MiniWall is a RESTful SaaS API where authenticated users can post thoughts, browse posts, comment and like other users' content.

## Features

* User registration and login using JWT (OAuth v2 style)
* Create, read, update and delete posts
* Comment and like posts (users cannot like or comment on their own posts)
* Posts are sorted by number of likes (descending), then by newest first
* Advanced search by title keyword, owner and date range (using denormalised table)
* All endpoints are protected except register and login

## Technologies

* Backend: Node.js + Express
* Database: MongoDB (NoSQL) with Mongoose
* Authentication: JWT + bcryptjs
* Validation: express-validator
* Deployment: Docker + Google Cloud Platform (GCP VM)
* Testing: Thunder Client

## Local Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Ab-vs223/miniwall.git
   cd miniwall
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Run the application

   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## Deployment

Deployed on Google Cloud e2-micro VM using Docker and Docker Compose.
Screenshots are available in the `screenshots/` folder.

## Testing

All 15 test cases from the coursework brief were executed using Thunder Client.
Screenshots of all test cases (TC1 to TC15) are available in the `screenshots/` folder.

## References

* CSM020 Lecture Notes (REST, SaaS & Microservices, NoSQL, Docker)
* Coursework Brief
