#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('osmLayer',)

    def waitForIdle(self, timeout=5):
        self.runScript(
            'window._wait = false; window.gjsmap.onIdle(function () {window._wait = true;});'
        )
        self.wait(variable='window._wait', timeout=timeout)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('osmLayer/index.html')
        self.wait()

    def test_osm_draw(self):
        testName = 'osmDraw'
        self.loadPage()
        self.screenshotTest(testName, revision=6)

    def test_osm_pan(self):
        testName = 'osmPan'
        self.loadPage()
        self.drag('#map', (200, 150))
        self.waitForIdle()
        self.screenshotTest(testName, revision=6)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()