import fs from 'fs';

import { Octokit } from 'octokit';
import YAML from 'yaml';

export type DependencyPlatform = 'wsl' | 'linux' | 'darwin' | 'win32';
export type Platform = 'linux' | 'darwin' | 'win32';
export type GoPlatform = 'linux' | 'darwin' | 'windows';

export type DownloadContext = {
  versions: DependencyVersions;
  dependencyPlaform: DependencyPlatform;
  platform: Platform;
  goPlatform: GoPlatform;
  // whether we are running on M1
  isM1: boolean;
  // resourcesDir is the directory that external dependencies and the like go into
  resourcesDir: string;
  // binDir is for binaries that the user will execute
  binDir: string;
  // internalDir is for binaries that RD will execute behind the scenes
  internalDir: string;
};

export type AlpineLimaISOVersion = {
  // The version of the ISO build
  isoVersion: string;
  // The version of Alpine Linux that the ISO is built on
  alpineVersion: string
};

export class DependencyVersions {
  limaAndQemu = '';
  alpineLimaISO: AlpineLimaISOVersion = { isoVersion: '', alpineVersion: '' };
  WSLDistro = '';
  kuberlr = '';
  helm = '';
  dockerCLI = '';
  dockerBuildx = '';
  dockerCompose = '';
  trivy = '';
  steve = '';
  guestAgent = '';
  rancherDashboard = '';
  dockerProvidedCredentialHelpers = '';
  ECRCredentialHelper = '';
  hostResolver = '';
  mobyOpenAPISpec = '';

  constructor(inputObject: any) {
    for (const key in this) {
      const inputValue = inputObject[key];

      if (!inputValue) {
        throw new Error(`key "${ key }" from input object is falsy`);
      }
      this[key] = inputValue;
    }
  }

  static fromYAMLFile(path: string) {
    const rawContents = fs.readFileSync(path, 'utf-8');
    const obj = YAML.parse(rawContents);

    return new DependencyVersions(obj);
  }
}

export interface Dependency {
  name: string,
  download(context: DownloadContext): Promise<void>
  getLatestVersion(): Promise<string | AlpineLimaISOVersion>
}

/**
 * A lot of dependencies are hosted on Github via Github releases,
 * so the logic to fetch the latest version is very similar for
 * these releases. This lets us eliminate some of the duplication.
 */
export class GithubVersionGetter {
  name = 'GithubVersionGetter';
  githubOwner?: string;
  githubRepo?: string;

  async getLatestVersion(): Promise<string> {
    // ease development of new Dependency
    if (!this.githubOwner) {
      throw new Error(`Must define property "githubOwner" for dependency ${ this.name }`);
    }
    if (!this.githubRepo) {
      throw new Error(`Must define property "githubRepo" for dependency ${ this.name }`);
    }

    const response = await getOctokit().rest.repos.listReleases({ owner: this.githubOwner, repo: this.githubRepo });
    const latestVersionWithV = response.data[0].tag_name;

    return latestVersionWithV.replace(/^v/, '');
  }
}

let _octokit: Octokit | undefined;

export function getOctokit() {
  if (_octokit) {
    return _octokit;
  }
  const personalAccessToken = process.env.GITHUB_TOKEN;

  if (!personalAccessToken) {
    throw new Error('Please set GITHUB_TOKEN to a PAT to check versions of github-based dependencies.');
  }

  return new Octokit({ auth: personalAccessToken });
}
