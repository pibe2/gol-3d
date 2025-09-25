# Game of Life 3D

A three-dimensional adaptation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life) written using WebGL


### Building for Production

Create a production build:
```bash
bash infra/build.sh
```


### Deploying to Production

This project uses Wrangler to manage deployments to CloudFlare Workers.
1. Deployments can be triggered locally on-demand by running the below. Note that this will prompt you to log into the Cloudflare account.
    ```bash
    bash infra/deploy.sh
    ```
2. New commits to the `master` branch of the GitHub repository will also automatically trigger a build and deployment to Cloudflare using the same scripts.

