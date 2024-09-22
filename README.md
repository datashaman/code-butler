# code-butler

OpenAI assistants that helps you write code.

The app is an interface to define assistants and projects.
The AI assistants have access to file contents and can make changes to them (using OpenAI Function Calling).

_code-butler..._
* is a proof of concept
* is a work in progress
* **makes destructive changes to your project files**
* **is not responsible for any data loss or corruption**

**Use with caution and source control.**

## installation

Install the [GitHub CLI](https://cli.github.com/):

```bash
brew install gh
```

Clone the repository:

```bash
gh repo clone datashaman/code-butler
cd code-butler
```

Install dependencies:

```bash
yarn
```

## configuration

Copy `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file and set `OPENAI_API_KEY` to your OpenAI API key.

## database migration

This creates and migrates a _SQLite_ database `database/db.sqlite`:

```bash
yarn db:migrate
```

## development

Start the development server:

```bash
yarn dev
```

This will start the server at [http://localhost:3000](http://localhost:3000).

## architecture

The project is a [Nuxt.js](https://nuxt.com/) app with a _SQLite_ database.

[Tailwind CSS](https://tailwindcss.com/) and [DaisyUI](https://daisyui.com/) are used for styling.
