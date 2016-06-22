@echo off

@setlocal enableextensions
@cd /d "%~dp0"

NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
	echo This setup needs admin permissions. Please run this file as admin.
	pause
	exit
)

reg Query "HKLM\Hardware\Description\System\CentralProcessor\0" | find /i "x86" > NUL && set OS=32BIT || set OS=64BIT

if %OS%==32BIT (
	echo Downloading node 32BIT version
	set node_url=https://nodejs.org/dist/v4.4.3/node-v4.4.3-x86.msi
)


if %OS%==64BIT (
	echo Downloading node 64BIT version
	set node_url=https://nodejs.org/dist/v4.4.3/node-v4.4.3-x64.msi
)

echo %node_url%
SET CURRENTDIR2="%cd%"
echo %CURRENTDIR2%

powershell -command "start-bitstransfer -source %node_url% -destination C:\node_setup.msi"

start /wait msiexec.exe /i C:\node_setup.msi /l*v netfx.log

::CALL %~dp0%\configure-node.bat

echo Node install successfull. Now configuring bt-client

SET PATH=%PATH%;C:\Program Files\nodejs

::echo %PATH%
::echo %cd%

call npm --version
call npm install

echo "Node modules successfully installed. To start bt-client double click on run.bat"

pause