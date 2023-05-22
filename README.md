# About
**Course Connect** is a web application designed to streamline the hiring process of teaching assignments, undergraduate peer instructors, and graders by providing essential digital tools to students, faculty, and department leaders.

# Features
Course Connect works through an online portal that leads to a dashboard with useful tools for each type of user we serve: *students*, *faculty*, and *department leaders*.
- Students
    - Submit an application and check its status.
    - fjfj
- Faculty
- Department Leaders
  - Add courses manually using a form or automatically by uploading a spreadsheet (.xls, .xlsx, .csv, etc.).
  - Manage 


# Development Stack
Below are the technologies used in the development stack of Course Connect.

## **Backend**
Development platform and database: <a href="https://firebase.google.com/">Firebase/Firestore</a>

*Firebase* is a backend development platform that handles server-side functionalities such as authentication, hosting, and database creation/management.

*Firestore* is a flexible and scalable NoSQL document database, offering real-time data synchronization and CRUD operations with queries and API calls.

## **Frontend**
JavaScript library: <a href="https://react.dev/">React</a>

*React* is an open-source JavaScript library used for building user interfaces using a declarative syntax to combine and sustain an interactive component architecture, supported by its Virtual Document Object Model (Virtual DOM).

JavaScript framework: <a href="https://nextjs.org/">Next.js</a>

*Next.js* is a framework built on top of React to extend its utility and add functionality, namely server-side rendering, static site generation, a built-in routing system, and more - as well as a more streamlined development experience with several quality-of-life tools.

CSS framework: <a href="https://tailwindcss.com/">Tailwind CSS</a>

*Tailwind CSS* is a CSS framework which provides a comprehensive set of low-level utility classes which encapsulate specific CSS properties and values, which allow developers to apply styles without writing custom CSS and build a highly configurable, modern, and responsive user interface.

## **Language & Tooling**
- JavaScript <a href="https://javascript.info/">(docs)</a>

*JavaScript* is the standard scripting language for web development, and it is therefore the foundation of interactive elements in the frontend.

- TypeScript <a href="https://www.typescriptlang.org/">(docs)</a>

*TypeScript* is a superset of JavaScript with added syntax which provides better integration into coding environments, making the development experience smoother.

- ESLint <a href="https://eslint.org/">(docs)</a>

*ESLint* is a static code analyzer and code style enforcer which evaluates problems existing within the codebase according to a set of rules, allowing for a more standardized and efficient development process.

# Initial Setup

Below is a description of the steps taken to create the file structure found in this repository. The information below is for your context only and is *not required to be understood* to develop this application. To see 

## Prerequisites
- Node.js (>= v18.16.0 LTS) and npm/npx <a href="https://nodejs.org/en">(download)</a>

*Node.js* is a JavaScript runtime which supports building scalable web applications. In other development stacks, it is used in the backend along with tools like *MongoDB* and *Express.js* to create a REST API connected to a database. Here, its only use is as a requirement for *Next.js*.

*npm* (Node Package Manager) is a package manager which comes with *Node.js* that is used for sharing JavaScript code worldwide and downloading/integrating it into your codebase and *npx* (Node Package eXecute) is an npm package runner which allows developers to execute any Javascript Package available on the npm registry without even installing it.

- Git <a href="https://git-scm.com/downloads">(download)</a> or GitHub Desktop <a href="https://desktop.github.com/">(download)</a>

*Git* is a version control tool that embeds commands in your terminal which allow downloading code from repositories hosted on the Internet. *GitHub Desktop* is an application which encapsulates those tools and presents them in a simpler format.

## Installation
The codebase was initially generated using the command-line interface tool called `create-next-app` made by the *Next.js* team. This tool automatically installs the packages for TypeScript, ESLint, and Tailwind CSS as well as enables *Next.js*'s  App Router and organizes the files into an 'src/' directory. More information is available <a href="https://nextjs.org/docs/getting-started/installation">here</a>.

The following line is run in the root directory and settings are configured:

`npx create-next-app@latest`

## Additional Packages
Two additional packages are necessary for integrating Firebase and Firestore with *Next.js*:
- <a href="https://firebase.google.com/docs/web/setup">firebase</a>
- <a href="https://www.npmjs.com/package/react-firebase-hooks">react-firebase-hooks</a>

These packages are then installed with the following line:

`npm install firebase react-firebase-hooks`

# Development

## Development Environment
Use the following steps to set up your development environment.

1. Ensure you **install the prerequisites** (Node.js >= v18.16.0 and Git).
2. **Clone** the repository to a folder of your choice. <a href="https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository"> (tutorial) </a>
3. In a terminal, enter the `cc-app` directory and **execute** the following command:  `npm run dev`

> The command in step 3 corresponds to the command `next dev` in the *Next.js* CLI; documentation is available <a href="https://nextjs.org/docs/app/api-reference/next-cli#development">here</a>.

From there, a localhost server will be started and any changes you save will be pushed *immediately* - no need to restart the server!

## Linting
Run the following command to execute ESLint, which will evaluate code written within each page to conform to the project's development standards:

`npm run lint`

> This corresponds to the command `next lint` in the *Next.js* CLI; documentation is available <a href="https://nextjs.org/docs/app/api-reference/next-cli#development">here</a>.

## Production Environment
Use the following steps to test your changes in a production-ready build.

1. Compile the application using `npm run build`.
2. Start the application in production mode using `npm run start`.

> These two steps correspond to the commands `next build` and `next start` in the *Next.js* CLI; documentation is available <a href="https://nextjs.org/docs/app/api-reference/next-cli">here</a>.

## List of Dependencies
Below is a complete list of all dependencies (npm packages) used in this project as of May 22nd, 2023:
- @types/node@20.2.3
- @types/react-dom@18.2.4
- @types/react@18.2.6
- autoprefixer@10.4.14
- eslint-config-next@13.4.3
- eslint-config-prettier@8.8.0
- eslint@8.41.0
- husky@8.0.3
- lint-staged@13.2.2
- next@13.4.3
- postcss@8.4.23
- prettier@2.8.8
- react-dom@18.2.0
- react@18.2.0
- tailwindcss@3.3.2
- typescript@5.0.4

To add a package, make sure you are in the `cc-app` directory and run `npm install (PACKAGE NAME HERE)` in your terminal.