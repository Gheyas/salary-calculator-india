#!/usr/bin/env python3

"""
generate_sitemap.py
Simple crawler that respects robots.txt, crawls a site (same domain),
and generates sitemap.xml with <loc>, <lastmod>, <changefreq>, <priority>.

Usage:
pip install requests beautifulsoup4
python generate_sitemap.py --url https://paycommissions.in --output sitemap.xml --max-pages 1000

Defaults:
max-pages: 5000
changefreq: monthly
priority: 0.5
"""

import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urldefrag, urlparse
import time
import xml.etree.ElementTree as ET
from datetime import datetime
import urllib.robotparser
import sys
import re

COMMON_EXCLUDE_EXT = re.compile(r".*.(jpg|jpeg|png|gif|svg|pdf|docx?|xlsx?|zip|rar|mp3|mp4|avi|mov|ico|woff2?|ttf)(?.*)?$", re.I)

def same_domain(u1, u2):
    return urlparse(u1).netloc == urlparse(u2).netloc

def normalize(url, base):
    url = urljoin(base, url)
    url, _ = urldefrag(url)
    # optionally strip trailing slash normalization
    # if url.endswith('/') and len(url) > len(base): url = url.rstrip('/')
    return url

def can_fetch(rp, user_agent, url):
    try:
        return rp.can_fetch(user_agent, url)
    except:
        return True

def crawl(base_url, max_pages=5000, user_agent='SitemapGeneratorBot/1.0', delay=0.2):
    parsed = urlparse(base_url)
    base_root = f"{parsed.scheme}://{parsed.netloc}"
    
    rp = urllib.robotparser.RobotFileParser()
    robots_url = urljoin(base_root, '/robots.txt')
    try:
        rp.set_url(robots_url)
        rp.read()
    except:
        # if robots fails, proceed but be polite
        pass
    
    seen = set()
    queue = [base_url]
    sitemap_urls = []
    
    session = requests.Session()
    session.headers.update({"User-Agent": user_agent})
    
    while queue and len(sitemap_urls) < max_pages:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        
        if not can_fetch(rp, user_agent, url):
            # skip disallowed by robots
            continue
        
        # skip binary or asset extensions
        if COMMON_EXCLUDE_EXT.match(url):
            continue
        
        try:
            # use HEAD first to check content-type
            head = session.head(url, allow_redirects=True, timeout=10)
            content_type = head.headers.get('content-type', '')
            if 'text/html' not in content_type and 'application/xhtml+xml' not in content_type:
                # skip non-html
                continue
            
            # GET page
            r = session.get(url, timeout=15)
            if r.status_code != 200:
                continue
            
            sitemap_urls.append(url)
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # find anchor links
            for a in soup.find_all('a', href=True):
                href = a['href'].strip()
                if href.startswith('mailto:') or href.startswith('tel:'):
                    continue
                n = normalize(href, url)
                if not same_domain(n, base_root):
                    continue
                if n in seen:
                    continue
                if COMMON_EXCLUDE_EXT.match(n):
                    continue
                queue.append(n)
            
            time.sleep(delay)  # be polite
        except Exception as e:
            # print error & continue
            # print(f"error fetching {url}: {e}", file=sys.stderr)
            continue
    
    return sitemap_urls

def build_sitemap(urls, output_file, changefreq='monthly', priority='0.5'):
    urlset = ET.Element('urlset', {
        'xmlns': "http://www.sitemaps.org/schemas/sitemap/0.9",
        'xmlns:image': "http://www.google.com/schemas/sitemap-image/1.1"
    })
    
    lastmod = datetime.utcnow().date().isoformat()
    
    for u in sorted(set(urls)):
        url_el = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url_el, 'loc'); loc.text = u
        lm = ET.SubElement(url_el, 'lastmod'); lm.text = lastmod
        cf = ET.SubElement(url_el, 'changefreq'); cf.text = changefreq
        pr = ET.SubElement(url_el, 'priority'); pr.text = priority
    
    tree = ET.ElementTree(urlset)
    tree.write(output_file, encoding='utf-8', xml_declaration=True)
    print(f"Wrote {len(urls)} URLs to {output_file}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True, help='Base URL to crawl (e.g., https://paycommissions.in)')
    parser.add_argument('--output', default='sitemap.xml', help='Output sitemap filename')
    parser.add_argument('--max-pages', type=int, default=5000, help='Maximum number of pages to crawl')
    parser.add_argument('--changefreq', default='monthly', help='changefreq value to put in sitemap entries')
    parser.add_argument('--priority', default='0.5', help='priority value to put in sitemap entries')
    
    args = parser.parse_args()
    
    base = args.url
    if not base.startswith('http'):
        base = 'https://' + base
    
    print(f"Crawling {base} ... (max {args.max_pages} pages)")
    urls = crawl(base, max_pages=args.max_pages)
    
    if not urls:
        print("No URLs found — check the URL or network/robots.txt restrictions.")
        sys.exit(1)
    
    build_sitemap(urls, args.output, changefreq=args.changefreq, priority=args.priority)

if __name__ == '__main__':
    main()
