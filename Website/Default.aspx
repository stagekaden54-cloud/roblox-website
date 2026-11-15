<%@ Page Title="BLOCK16" Language="C#" MasterPageFile="~/Roblox.Master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="Roblox.Website.Default" %>

<asp:Content ID="NoBannerAd" ContentPlaceHolderID="cphBannerAd" runat="server">
</asp:Content>

<asp:Content ID="Default" ContentPlaceHolderID="cphRoblox" runat="server">
    <style type="text/css">
        .block16-home {
            width: 970px;
            margin: 0 auto 30px auto;
            color: #333;
            font-family: Arial, Helvetica, sans-serif;
        }
        .block16-home a {
            color: #0956a5;
            text-decoration: none;
        }
        .block16-home a:hover {
            text-decoration: underline;
        }
        .block16-home-banner {
            padding: 22px 25px;
            margin-bottom: 12px;
            color: #fff;
            background: #1b5796;
            border: 1px solid #0e3c70;
        }
        .block16-home-banner h1 {
            margin: 0 0 7px 0;
            font-size: 27px;
            line-height: 32px;
            color: #fff;
        }
        .block16-home-banner p {
            margin: 0;
            font-size: 14px;
            line-height: 21px;
            color: #e8f1fb;
        }
        .block16-home-columns {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin-left: -10px;
        }
        .block16-home-column {
            display: table-cell;
            vertical-align: top;
            background: #fff;
            border: 1px solid #ccc;
            padding: 12px;
        }
        .block16-home-column.primary {
            width: 58%;
        }
        .block16-home-column.secondary {
            width: 42%;
        }
        .block16-home-column h2 {
            margin: 0 0 10px 0;
            padding-bottom: 7px;
            border-bottom: 1px solid #ccc;
            color: #333;
            font-size: 17px;
        }
        .block16-home-column p {
            margin: 0 0 10px 0;
            font-size: 13px;
            line-height: 19px;
        }
        .block16-home-links {
            margin: 0;
            padding: 0;
            list-style: none;
        }
        .block16-home-links li {
            padding: 7px 0;
            border-bottom: 1px solid #e5e5e5;
            font-size: 13px;
        }
        .block16-home-links li:last-child {
            border-bottom: 0;
        }
        .block16-home-status {
            margin-top: 12px;
            padding: 9px 11px;
            background: #f1f5f9;
            border: 1px solid #cbd8e5;
            font-size: 12px;
            line-height: 18px;
        }
        @media screen and (max-width: 700px) {
            .block16-home {
                width: auto;
                margin: 0 10px 20px 10px;
            }
            .block16-home-columns,
            .block16-home-column {
                display: block;
                width: auto !important;
                margin: 0;
            }
            .block16-home-column {
                margin-bottom: 10px;
            }
        }
    </style>

    <div class="block16-home">
        <div class="block16-home-banner">
            <h1>Welcome to BLOCK16</h1>
            <p>A classic-era building and gaming revival project. Explore the site and follow development as the experience takes shape.</p>
        </div>

        <div class="block16-home-columns">
            <div class="block16-home-column primary">
                <h2>Explore BLOCK16</h2>
                <p>Use the original site navigation to explore the areas currently available.</p>
                <ul class="block16-home-links">
                    <li><a href="/games">Games</a> — browse the games area</li>
                    <li><a href="/Catalog">Catalog</a> — visit the catalog</li>
                    <li><a href="/leaderboards">Leaderboards</a> — view player rankings</li>
                    <li><a href="/News/">News</a> — read project updates</li>
                    <li><a href="/download/windows">Windows Client</a> — view client information</li>
                </ul>
            </div>

            <div class="block16-home-column secondary">
                <h2>Project status</h2>
                <p>BLOCK16 is under development. Some legacy pages and services may not be available until the application backend is hosted and verified.</p>
                <div class="block16-home-status">
                    <strong>Account registration is temporarily unavailable.</strong><br />
                    This page does not collect account details or submit signup information.
                </div>
                <p style="margin-top: 12px;">Already have an account? <a href="/Login/">Visit login</a>.</p>
            </div>
        </div>
    </div>
</asp:Content>