# code-butler

OpenAI assistants that help you write code.

The app is an interface to define assistants and projects.
The AI assistants have access to file contents and can make changes to them (using OpenAI Function Calling).

_code-butler..._
* is a proof of concept
* is a work in progress
* **makes destructive changes to your project files**
* **is not responsible for any data loss or corruption**

**Use with caution and source control.**

_You do not have to point the assistant to your whole project directory. You can point it to a subdirectory, focusing on just components (for example). It is up to you to decide how much access you want to give the assistant. Less is better, less room to make mistakes._


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

## prompts

The assistant instructions are important. They form the basis of the assistant's knowledge and capabilities, and are used to generate the assistant's responses.

The project description is important. It is sent as additional instructions to the assistant when it is called within a project.

Use this to provide context and constraints for the project. Describe the project requirements, the programming language, the libraries and frameworks used, and any other relevant information that will help the assistant understand the project.

The model dropdown on the chat page is for overriding the default model used by the assistant assigned to the project. Set it to `assistant` to use the default model.

_Ensure the `path` field is set to the correct path to the project directory. Sadly we cannot use a directory picker in the browser, so you will have to type the path manually or copy it from the console._

## architecture

The project is a [Nuxt.js](https://nuxt.com/) app with a _SQLite_ database.

[Tailwind CSS](https://tailwindcss.com/) and [DaisyUI](https://daisyui.com/) are used for styling.
