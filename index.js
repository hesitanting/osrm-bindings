const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const osrmLibPath = path.dirname(require.resolve('osrm'));
const osrmBindingPath = path.join(osrmLibPath, 'binding');
const osrmProfilesPath = path.join(osrmLibPath, '..', 'profiles');

const osrmExctract = path.join(osrmBindingPath, 'osrm-extract');
const osrmContract = path.join(osrmBindingPath, 'osrm-contract');
const osrmDatastore = path.join(osrmBindingPath, 'osrm-datastore');

const replaceExtension = (filePath, newExtension) => {
  const baseFileName = path.basename(filePath);
  const newFileName = baseFileName.split('.')[0] + newExtension;
  return path.join(path.dirname(filePath), newFileName);
};

const getProfileNames = () =>
  new Promise((resolve, reject) =>
    fs.readdir(osrmProfilesPath, (error, fileNames) => {
      if (error) {
        reject(error);
      }

      const profileNames = fileNames
        .filter(fileName => path.extname(fileName) === '.lua')
        .map(fileName => path.basename(fileName, '.lua'));

      resolve(profileNames);
    })
  );

const extract = (extractPath, profileName, options = {}) =>
  new Promise((resolve, reject) => {
    const { stdoutStream, stderrStream } = options;

    const extractProfile = path.join(osrmProfilesPath, `${profileName}.lua`);
    const graphPath = replaceExtension(extractPath, '.osrm');

    const extractProcess = spawn(osrmExctract, ['-p', extractProfile, extractPath]);

    if (stdoutStream) {
      extractProcess.stdout.on('data', data => stdoutStream.write(data));
    }

    if (stderrStream) {
      extractProcess.stderr.on('data', data => stderrStream.write(data));
    }

    extractProcess.on('close', exitCode => {
      if (exitCode === 0) {
        return resolve(graphPath);
      }

      return reject(
        new Error(`OSRM failed to extract graph from ${extractPath} with exit code ${exitCode}`)
      );
    });
  });

const contract = (graphPath, options = {}) =>
  new Promise((resolve, reject) => {
    const { stdoutStream, stderrStream } = options;

    const contractProcess = spawn(osrmContract, [graphPath]);

    if (stdoutStream) {
      contractProcess.stdout.on('data', data => stdoutStream.write(data));
    }

    if (stderrStream) {
      contractProcess.stderr.on('data', data => stderrStream.write(data));
    }

    contractProcess.on('close', exitCode => {
      if (exitCode === 0) {
        return resolve(graphPath);
      }

      return reject(
        new Error(`OSRM failed to contract graph from ${graphPath} with exit code ${exitCode}`)
      );
    });
  });

const datastore = (graphPath, options = {}) =>
  new Promise((resolve, reject) => {
    const { stdoutStream, stderrStream } = options;

    const datastoreProcess = spawn(osrmDatastore, [graphPath]);

    if (stdoutStream) {
      datastoreProcess.stdout.on('data', data => stdoutStream.write(data));
    }

    if (stderrStream) {
      datastoreProcess.stderr.on('data', data => stderrStream.write(data));
    }

    datastoreProcess.on('close', exitCode => {
      if (exitCode === 0) {
        return resolve(graphPath);
      }

      return reject(
        new Error(`OSRM failed to process datastore on ${graphPath} with exit code ${exitCode}`)
      );
    });
  });

module.exports = { getProfileNames, extract, contract, datastore };
