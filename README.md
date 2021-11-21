# Apollo Federation Monorepo Example

Using yarn workspaces.

## Usage

> **[Yarn](http://npm.im/yarn) 1.22.10 or newer is required**

### Initialization

```
git clone git@github.com:aynik/apollo-federation-monorepo.git
cd apollo-federation-monorepo
yarn install
yarn build
```

### Configuration

### Add new services

- Copy any service structure into a new one
- Run `yarn reconf` for update tsconfig references
- Add your new service name in package.json
- Rename your service's package.json name
- Run `yarn build`
