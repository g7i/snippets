import argparse
import os
import random
import time
import urllib.parse

from bs4 import BeautifulSoup
from selenium import webdriver
from getpass import getpass
from selenium.webdriver.common.action_chains import ActionChains


def Main():
    parser = argparse.ArgumentParser()
    parser.add_argument("email")
    # parser.add_argument("password", help="linkedin password")
    args = parser.parse_args()
    # if args.password:
    #     password = getpass()

    password = getpass(prompt='Enter Password: ')

    browser = webdriver.Chrome()
    browser.get('https://linkedin.com/uas/login')

    email_el = browser.find_element_by_id("username")
    email_el.send_keys(args.email)
    pass_el = browser.find_element_by_id("password")
    pass_el.send_keys(password)
    pass_el.submit()
    # os.system('clear')
    print("Logged In")
    react(browser)
    # editMyProfile(browser)
    # ViewBot(browser)
    browser.close()


def editMyProfile(browser):
    link = browser.find_element_by_css_selector("div.feed-identity-module__actor-meta.profile-rail-card__actor-meta"
                                                ".break-words a").get_attribute('href')
    browser.get(link + "edit/about/")
    time.sleep(5)
    text_area = browser.find_element_by_id("about-summary")
    text_area.send_keys("Looking for opportunities")
    text_area.submit()
    time.sleep(10)

def react(browser):
    els = browser.find_elements_by_css_selector(".reactions-react-button.ember-view")

    hover = ActionChains(browser).move_to_element(els[0])
    hover.perform()
    print(els[0].get_attribute('innerHTML'))
    time.sleep(10)


def getPeopleLinks(page):
    links = []
    for link in page.find_all('a'):
        url = link.get('href')
        if url:
            if '/in/' in url:
                links.append(url)
    return links


def getJobLinks(page):
    links = []
    for link in page.find_all('a'):
        url = link.get('href')
        if url:
            if '/jobs' in url:
                links.append(url)
    return links


def getID(url):
    pUrl = urllib.parse.urlparse(url)
    return urllib.parse.parse_qs(pUrl.query)['in/'][0]


def ViewBot(browser):
    visited = {}
    pList = []
    count = 0
    browser.get("https://www.linkedin.com/mynetwork/")
    # npage = BeautifulSoup(browser.page_source)
    # f = open("net.txt", "wb")
    # f.write(npage.encode("utf-8"))
    # f.close()

    time.sleep(5)
    page = BeautifulSoup(browser.page_source, features="html.parser")
    people = getPeopleLinks(page)
    print(people)
    if people:
        for person in people:
            # ID = getID(person)
            if person not in visited:
                pList.append(person)
                # print(person)
            # visited[ID] = 1

    pList.reverse()

    id = browser.find_element_by_css_selector(
        '.invitation-card__action-btn.artdeco-button.artdeco-button--2.artdeco-button--secondary.ember-view').get_attribute(
        "id")
    # 'invitation-card__action-btn artdeco-button artdeco-button--2 artdeco-button--secondary ember-view'
    browser.execute_script("document.getElementById('" + id + "').style.backgroundColor = 'red';")
    time.sleep(5)
    browser.find_element_by_css_selector(
        '.invitation-card__action-btn.artdeco-button.artdeco-button--2.artdeco-button--secondary.ember-view').click()
    time.sleep(10)

    while len(pList) > 0:

        time.sleep(random.uniform(6, 12))

        # page = BeautifulSoup(browser.page_source)
        # people = getPeopleLinks(page)
        # if people:
        #     for person in people:
        #         # ID = getID(person)
        #         if person not in visited:
        #             pList.append(person)
        #             # print(person)
        #         # visited[ID] = 1

        if pList:
            person = pList.pop()
            print("Person ", count, " --> ", person)
            browser.get("https://www.linkedin.com/" + person)
            count += 1
        else:
            # jobs = getJobLinks(page)
            # if jobs:
            #     job = random.choice(jobs)
            #     root = 'http://www.linkedin.com'
            #     roots = 'http://www.linkedin.com'
            #     if root not in job or roots not in job:
            #         job = 'https://www.linkedin.com' + job
            #     browser.get(job)
            # else:
            #     print("I'm Lost Exiting")
            #     break
            pass
        print(count, " ", browser.title + " -> Visited")


if __name__ == '__main__':
    Main()
