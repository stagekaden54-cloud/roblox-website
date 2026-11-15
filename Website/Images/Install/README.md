# BLOCK16 installation image audit

This directory contains legacy installation artwork inherited from the old Roblox website.

## Audit findings

- `Wizard.PNG` shows an InstallShield wizard branded for ROBLOX.
- `DownloadPrompt.PNG` and `ConfirmPrompt.PNG` show Windows security dialogs naming `Roblox.exe`, `setup.roblox.com`, and/or ROBLOX Corporation.
- `chromeinstructions.png`, `firefoxInstall_preview.png`, and `ieInstall_preview.png` show legacy browser download flows and Roblox branding.
- The `*_v2.jpg` images also contain Roblox-branded browser screens, publisher details, and old browser-specific steps.
- These screenshots describe an obsolete plugin-era installation flow. They must not be presented as instructions for the BLOCK16 Windows client.

## Relationship to the current installer view

The reviewed `Website/Views/Game/ClientInstaller.cshtml` does not reference these local PNG/JPG files. It instead embeds old images from `images.rbxcdn.com`, includes a link to `roblox.com/Download`, and has legacy browser-specific installation markup.

The view is rendered by `Website/UserControls/ClientInstaller.ascx`. Its view model still configures an old plugin installation host and CLSID. This is not a verified BLOCK16 Windows-client installer flow.

## BLOCK16 handling

- Keep these legacy assets out of new BLOCK16 download and installation pages.
- Do not simply replace the text/logo inside the old screenshots: the underlying Windows/browser steps are obsolete and could mislead users.
- Replace them with newly authored BLOCK16 instructions after the actual Windows client package format, publisher/signing identity, installer UI, and supported Windows versions are established.
- Until then, do not describe these images as current instructions. Do not remove the legacy files until all references across the application have been conclusively checked.

## Verification limits

This was a static source and image review. GitHub's code-search response was incomplete, so absence of references elsewhere in the repository has not been established. No application build or runtime test was performed.


## Windows client build status — 2026-11-15

The source fork's latest successful Windows build found during review is Run #88, but it produces a Debug Win32 (x86) executable named `RobloxPlayerBetaRaw.exe`, not a production BLOCK16 Release client. The binary is unsigned and retains Roblox-specific branding and legacy strings. It must not be presented as the official BLOCK16 download.

Do not reuse the old screenshots for the EXE flow. A new BLOCK16 download page should be connected only after a reviewed, licensed, production Release executable and its supported installation/runtime requirements are ready. The Run #88 artifact is a short-lived CI artifact, not permanent website hosting.
