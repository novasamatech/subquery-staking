# SubQuery - Starter Package

The Starter Package is an example that you can use as a starting point for developing your SubQuery project.
A SubQuery package defines which data The SubQuery will index from the Substrate blockchain, and how it will store it.

## Preparation

#### Environment

- [Typescript](https://www.typescriptlang.org/) are required to compile project and define types.

- Both SubQuery CLI and generated Project have dependencies and require [Node](https://nodejs.org/en/).

#### Install the SubQuery CLI

Install SubQuery CLI globally on your terminal by using NPM:

```
npm install -g @subql/cli
```

Run help to see available commands and usage provide by CLI

```
subql help
```

## Initialize the starter package

Inside the directory in which you want to create the SubQuery project, simply replace `project-name` with your project name and run the command:

```
subql init --starter project-name
```

Then you should see a folder with your project name has been created inside the directory, you can use this as the start point of your project. And the files should be identical as in the [Directory Structure](https://doc.subquery.network/directory_structure.html).

Last, under the project directory, run following command to install all the dependency.

```
yarn install
```

## Adding a New Network

To add a new network to your SubQuery project, follow these steps:

1. **Create a Project YAML File**:
   - Create a new file named `project-{name}.yaml` in the root directory of your project.
   - This file will contain the configuration specific to the new network.

2. **Set Network Data**:
   - In the newly created `project-{name}.yaml` file, set the network parameters such as `endpoint`, `genesisHash`, and other relevant details.

3. **Add Separate Mapping**:
   - Create a new mapping file in the [src/mappings/](src/mappings) directory, named `{name}.ts`.
   - This file should include the necessary handlers and logic for the new network.

4. **Include Genesis, DIRECT_STAKING_TYPE, and RewardCurveConfig**:
   - In your new mapping file, ensure you define the `genesis`, `DIRECT_STAKING_TYPE`, and `rewardCurveConfig` specific to the new network.

5. **Export in `src/index.ts`**:
   - Update the [src/index.ts](./src/index.ts) file to export the new handlers from your `{name}.ts` mapping file.

6. **Add Network Types**:
   - If the new network requires custom types, add them to the `chainTypes` section in the appropriate configuration file. Do not forget to add new exports in [package.json](./package.json)

7. **Update `@subquery-multichain.yaml`**:
   - Add the new project file to the `projects` array in [subquery-multichain.yaml](./subquery-multichain.yaml).

By following these steps, you can extend your SubQuery project to support additional networks.

## Code generation

In order to index your SubQuery project, it is mandatory to build your project first.
Run this command under the project directory.

```
yarn codegen
```

## Build the project

In order to deploy your SubQuery project to our hosted service, it is mandatory to pack your configuration before upload.
Run pack command from root directory of your project will automatically generate a `your-project-name.tgz` file.

```
yarn build
```

## Indexing and Query

#### Run required systems in docker

Under the project directory run following command:

```
docker-compose pull && docker-compose up
```

#### Query the project

Open your browser and head to `http://localhost:3000`.

Finally, you should see a GraphQL playground is showing in the explorer and the schemas that ready to query.

For the `subql-starter` project, you can try to query with the following code to get a taste of how it works.

```graphql
{
  query {
    starterEntities(first: 10) {
      nodes {
        field1
        field2
        field3
        field4
      }
    }
  }
}
```
## License
SubQuery staking is available under the MIT license. See the LICENSE file for more info.
© Novasama Technologies GmbH 2023