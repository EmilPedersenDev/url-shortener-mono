import * as path from "path";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const ONE_YEAR_SECONDS = 31536000;
const S3_ORIGIN_ID = "url-shortener-s3-origin";

export interface StaticSiteInput {
  /** Path to the client directory (e.g. repo root / client). */
  clientPath: string;
}

export function createStaticSite(input: StaticSiteInput) {
  const bucket = new aws.s3.Bucket("url-shortener-site", {
    bucketPrefix: "url-shortener-site-",
    forceDestroy: true,
  });

  new aws.s3.BucketPublicAccessBlock("url-shortener-site-block-public", {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });

  const oac = new aws.cloudfront.OriginAccessControl("url-shortener-oac", {
    name: "url-shortener-oac",
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
  });

  const distribution = new aws.cloudfront.Distribution("url-shortener-distribution", {
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    comment: "URL Shortener static site",
    origins: [
      {
        domainName: bucket.bucketRegionalDomainName,
        originId: S3_ORIGIN_ID,
        originAccessControlId: oac.id,
      },
    ],
    defaultCacheBehavior: {
      targetOriginId: S3_ORIGIN_ID,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      forwardedValues: {
        queryString: false,
        cookies: { forward: "none" },
      },
      minTtl: 0,
      defaultTtl: ONE_YEAR_SECONDS,
      maxTtl: ONE_YEAR_SECONDS,
      compress: true,
    },
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    viewerCertificate: {
      cloudfrontDefaultCertificate: true,
    },
  });

  const bucketPolicy = aws.iam.getPolicyDocumentOutput({
    statements: [
      {
        sid: "AllowCloudFrontServicePrincipal",
        effect: "Allow",
        principals: [{ type: "Service", identifiers: ["cloudfront.amazonaws.com"] }],
        actions: ["s3:GetObject"],
        resources: [pulumi.interpolate`${bucket.arn}/*`],
        conditions: [
          {
            test: "StringEquals",
            variable: "AWS:SourceArn",
            values: [distribution.arn],
          },
        ],
      },
    ],
  });

  new aws.s3.BucketPolicy("url-shortener-site-policy", {
    bucket: bucket.id,
    policy: bucketPolicy.json,
  });

  const clientPath = input.clientPath;

  new aws.s3.BucketObject("index-html", {
    bucket: bucket.id,
    key: "index.html",
    source: new pulumi.asset.FileAsset(path.join(clientPath, "index.html")),
    contentType: "text/html",
  });

  new aws.s3.BucketObject("index-js", {
    bucket: bucket.id,
    key: "index.js",
    source: new pulumi.asset.FileAsset(path.join(clientPath, "index.js")),
    contentType: "application/javascript",
  });

  new aws.s3.BucketObject("config-js", {
    bucket: bucket.id,
    key: "config.js",
    source: new pulumi.asset.FileAsset(path.join(clientPath, "config.js")),
    contentType: "application/javascript",
  });

  const cloudFrontUrl = pulumi.interpolate`https://${distribution.domainName}`;

  return {
    bucket,
    distribution,
    cloudFrontUrl,
    distributionId: distribution.id,
    bucketName: bucket.id,
  };
}
