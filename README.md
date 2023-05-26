# About

**Course Connect** is a web application designed to streamline the hiring process of teaching assignments, undergraduate peer instructors, and graders by providing essential digital tools to _students_, _faculty_, and _department leaders_.

# Features

Course Connect works through an online portal that leads to a dashboard with useful tools for each type of user we serve: _students_, _faculty_, and _department leaders_.

- Students
  - Submit an application to be a TA, UPI, or Grader and check its status.
  - After hiring, view information about your assigned course(s) from a database.
- Faculty
  - Review applications for TAs, UPIs, and Graders to streamline the hiring process.
  - Invite students to apply for a TA, UPI, or Grader position.
  - View information about your course(s) from a database.
- Department Leaders
  - Add courses to a database manually using a form or automatically by uploading a spreadsheet (.xls, .xlsx, .csv, etc.).
  - Manage (add, delete, edit) information of users (students and faculty) and courses within the database.

# Development Stack

Below are the technologies used in the development stack of Course Connect.

## **Backend**

Development platform and database: <a href="https://firebase.google.com/">Firebase/Firestore</a>

_Firebase_ is a backend development platform that handles server-side functionalities such as authentication, hosting, and database creation/management.

_Firestore_ is a flexible and scalable NoSQL document database, offering real-time data synchronization and CRUD operations with queries and API calls.

## **Frontend**

JavaScript library: <a href="https://react.dev/">React</a>

_React_ is an open-source JavaScript library used for building user interfaces using a declarative syntax to combine and sustain an interactive component architecture, supported by its Virtual Document Object Model (Virtual DOM).

JavaScript framework: <a href="https://nextjs.org/">Next.js</a>

_Next.js_ is a framework built on top of React to extend its utility and add functionality, namely server-side rendering, static site generation, a built-in routing system, and more - as well as a more streamlined development experience with several quality-of-life tools.

CSS framework: <a href="https://tailwindcss.com/">Tailwind CSS</a>

_Tailwind CSS_ is a CSS framework which provides a comprehensive set of low-level utility classes which encapsulate specific CSS properties and values, which allow developers to apply styles without writing custom CSS and build a highly configurable, modern, and responsive user interface.

## **Language & Tooling**

- JavaScript <a href="https://javascript.info/">(docs)</a>

_JavaScript_ is the standard scripting language for web development, and it is therefore the foundation of interactive elements in the frontend.

- TypeScript <a href="https://www.typescriptlang.org/">(docs)</a>

_TypeScript_ is a superset of JavaScript with added syntax which provides better integration into coding environments, making the development experience smoother.

- ESLint <a href="https://eslint.org/">(docs)</a>

_ESLint_ is a static code analyzer and code style enforcer which evaluates problems existing within the codebase according to a set of rules, allowing for a more standardized and efficient development process.

# Initial Setup

Below is a description of the steps taken to create the file structure found in this repository. The information below is for your context only and is _not required to be understood_ to develop this application. To see

## Prerequisites

- Node.js (>= v18.16.0 LTS) and npm/npx <a href="https://nodejs.org/en">(download)</a>

_Node.js_ is a JavaScript runtime which supports building scalable web applications. In other development stacks, it is used in the backend along with tools like _MongoDB_ and _Express.js_ to create a REST API connected to a database. Here, its only use is as a requirement for _Next.js_.

_npm_ (Node Package Manager) is a package manager which comes with _Node.js_ that is used for sharing JavaScript code worldwide and downloading/integrating it into your codebase and _npx_ (Node Package eXecute) is an npm package runner which allows developers to execute any Javascript Package available on the npm registry without even installing it.

- Git <a href="https://git-scm.com/downloads">(download)</a> or GitHub Desktop <a href="https://desktop.github.com/">(download)</a>

_Git_ is a version control tool that embeds commands in your terminal which allow downloading code from repositories hosted on the Internet. _GitHub Desktop_ is an application which encapsulates those tools and presents them in a simpler format.

## Installation

The codebase was initially generated using the command-line interface tool called `create-next-app` made by the _Next.js_ team. This tool automatically installs the packages for TypeScript, ESLint, and Tailwind CSS as well as enables _Next.js_'s App Router and organizes the files into an 'src/' directory. More information is available <a href="https://nextjs.org/docs/getting-started/installation">here</a>.

The following line is run in the root directory and settings are configured:

`npx create-next-app@latest`

## Additional Packages

Two additional packages are necessary for integrating Firebase and Firestore with _Next.js_:

- <a href="https://firebase.google.com/docs/web/setup">firebase</a>
- <a href="https://www.npmjs.com/package/react-firebase-hooks">react-firebase-hooks</a>

These packages are then installed with the following line:

`npm install firebase react-firebase-hooks`

# Development

## Development Environment

Use the following steps to set up your development environment.

1. Ensure you **install the prerequisites** (Node.js >= v18.16.0 and Git).
2. **Clone** the repository to a folder of your choice. <a href="https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository"> (tutorial) </a>
3. In a terminal, enter the `cc-app` directory and **execute** the following command: `npm run dev`

> The command in step 3 corresponds to the command `next dev` in the _Next.js_ CLI; documentation is available <a href="https://nextjs.org/docs/app/api-reference/next-cli#development">here</a>.

From there, a localhost server will be started and any changes you save will be pushed _immediately_ - no need to restart the server!

## Linting

Run the following command to execute ESLint, which will evaluate code written within each page to conform to the project's development standards:

`npm run lint`

> This corresponds to the command `next lint` in the _Next.js_ CLI; documentation is available <a href="https://nextjs.org/docs/app/api-reference/next-cli#development">here</a>.

### Automated Linting and Code Formatting

Automated linting and code formatting upon git commit was set up using ESLint, Prettier, husky, and lint-staged according to a guide available <a href="https://victorbruce82.medium.com/setting-up-eslint-prettier-and-husky-in-your-nextjs-project-b468fb56331">here</a>.

- The prettier ruleset is customizable within the `.prettierrc.json` file.
  - See reference <a href="https://prettier.io/docs/en/configuration.html">here</a>.
- The ESLint ruleset is customizable within the `.eslintrc.json` file.
  - See reference <a href="https://nextjs.org/docs/app/building-your-application/configuring/eslint">here</a>.
- The automation commands executed upon git commit are customizable within the `lint-staged` object within the `package.json` file.
  - See reference <a href="https://github.com/okonet/lint-staged#Configuration">here</a>.

## Production Environment

Use the following steps to test your changes in a production-ready build.

1. Compile the application using `npm run build`.
2. Start the application in production mode using `npm run start`.

> These two steps correspond to the commands `next build` and `next start` in the _Next.js_ CLI; documentation is available <a href="https://nextjs.org/docs/app/api-reference/next-cli">here</a>.

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
