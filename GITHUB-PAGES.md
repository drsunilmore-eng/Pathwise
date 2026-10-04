# Publish PATHwise on GitHub Pages

This website uses static HTML, CSS, JavaScript, and images. No build command is needed.

1. Upload `index.html`, `styles.css`, `script.js`, `.nojekyll`, and the `assets` directory to the root of a GitHub repository.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select **main** and **/ (root)**, then save.
5. Wait for deployment and open the website URL displayed in Pages settings.

## Custom domain

Add your domain in **Settings → Pages → Custom domain** and save before changing DNS. GitHub creates the `CNAME` file for branch-based publishing.

Configure your domain's DNS using the records appropriate for your domain type and GitHub account. Enable **Enforce HTTPS** when GitHub has issued the certificate.

Official instructions:
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
