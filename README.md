# AfriBit wallet powered by:

<img src=".readme/galoy-logo.png" alt="Galoy Logo" width="300">
<div style="text-align: center;"> 
  <img width="1200" src="https://github.com/marcoleder/AfriBit-wallet/assets/32636827/33e7ca9c-3a6c-42bc-adad-e290c2b07894"/>
</div>

## Goal

This repository is the AfriBit mobile application. The goal is to make a mobile application compatible with Galoy's backend that is tailored to the specific region of Kibera, Kenya. It is built with [React Native](https://reactnative.dev/), and runs on both iOS and Android.

## Start

Prerequisite -- [Set up React Native](https://reactnative.dev/docs/environment-setup) by following the instructions in the **React Native CLI Quickstart** tab

Clone into the project

cd into the directory

type `yarn install`

type `yarn start`

In another window
type `yarn ios` or `yarn android` to run locally.

## Windows setup instructions
This guide serves as an overview of the steps needed to get set up with the repository on Windows.
Run the following commands **in powershell with admin privileges** in the given order to install WSL2 for your Windows installation:
   ```bash
   wsl --install
   ```

   ```bash
   wsl --set-default-version 2
   ```

   ```bash
   wsl --list --online
   ```
The above command gives you a list of available distros.
We strongly recommend to install ubuntu because its the simplest:
   ```bash
   wsl --install -d Ubuntu
   ```
If you would like to install a different distro, use the following command:
   ```bash
   wsl --install -d <DistroName>
   ```

Once your distribution is installed open a new terminal of the installed distribution (in example open an Ubuntu terminal).
Then update your distro:

   ```bash
   sudo apt update && sudo apt upgrade -y && sudo apt autoremove && sudo apt autoclean
   ```

\
\
\
Before installing the dependencies for the AfriBit wallet, we must ensure that your WSL installation has the necessary configuration.
Therefore run the three commands below to 
- allow virtualization
- increase the filewatcher limits
- prepare .bashrc for directory environment

   ```bash
   sudo gpasswd -a $USER kvm
   ```

   ```bash
   echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
   ```

   ```bash
   echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
   ```
\
!
### Close the terminal and open a new distro terminal !!!
!
\
\
Last two steps to run in WSL2, ubuntu terminal, are to install both the nix package manager and the directory environment package we have added to .bashrc before.
The first command will prompt you to install, just accept everything with typing Yes and then pressing enter.
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | \
     sh -s -- install --determinate
   ```

   ```bash
   nix profile install nixpkgs#direnv
   ```

\
\
you can then clone the repository with
   ```bash
   git clone git@github.com:AfriBit-wallet/AfriBit-wallet.git
   ```
and cd into the folder (again with distro terminal).\
It could be that direnv prompts you permission to read folder contents, simply run
   ```bash
   direnv allow
   ```
if this is the case. Nix will then setup everything automatically for you :)= 
\
\
\
\
If you experience an issue about syntax of the .envrc file, delete the .envrc file with
   ```bash
   rm .envrc
   ```

create a new .envrc with
   ```bash
   nano .envrc
   ```

and paste
```bash
if [ -f ".env.local" ]; then
  dotenv .env.local
fi

use flake .
```
in the file. Close and save the file, leave the folder with cd .. and then cd back into the folder and then wait a few minutes while everything is being installed
