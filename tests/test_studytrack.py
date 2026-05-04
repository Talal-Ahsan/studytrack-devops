import pytest

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


BASE_URL = "http://localhost:3000"


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)

    yield browser

    browser.quit()


def wait_for_element(driver, by, value):
    return WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((by, value))
    )


def wait_for_page_text(driver, text):
    WebDriverWait(driver, 10).until(
        lambda browser: text in browser.page_source
    )


def test_01_dashboard_opens(driver):
    driver.get(BASE_URL)

    title = wait_for_element(driver, By.ID, "page-title")

    assert "Dashboard" in title.text


def test_02_students_page_opens(driver):
    driver.get(BASE_URL + "/students")

    title = wait_for_element(driver, By.ID, "page-title")

    assert "Students" in title.text


def test_03_courses_page_opens(driver):
    driver.get(BASE_URL + "/courses")

    title = wait_for_element(driver, By.ID, "page-title")

    assert "Courses" in title.text


def test_04_assignments_page_opens(driver):
    driver.get(BASE_URL + "/assignments")

    title = wait_for_element(driver, By.ID, "page-title")

    assert "Assignments" in title.text


def test_05_dashboard_cards_are_visible(driver):
    driver.get(BASE_URL)

    student_card = wait_for_element(driver, By.ID, "student-card")
    course_card = wait_for_element(driver, By.ID, "course-card")
    assignment_card = wait_for_element(driver, By.ID, "assignment-card")
    pending_card = wait_for_element(driver, By.ID, "pending-card")

    assert student_card.is_displayed()
    assert course_card.is_displayed()
    assert assignment_card.is_displayed()
    assert pending_card.is_displayed()


def test_06_add_student(driver):
    driver.get(BASE_URL + "/students")

    driver.find_element(By.ID, "student-name").send_keys("Selenium Student")
    driver.find_element(By.ID, "student-email").send_keys("selenium.student@example.com")
    driver.find_element(By.ID, "student-semester").send_keys("6")
    driver.find_element(By.ID, "add-student-btn").click()

    wait_for_page_text(driver, "Student added successfully")
    wait_for_page_text(driver, "Selenium Student")

    assert "Student added successfully" in driver.page_source
    assert "Selenium Student" in driver.page_source


def test_07_search_student(driver):
    driver.get(BASE_URL + "/students")

    search_box = wait_for_element(driver, By.ID, "student-search")
    search_box.clear()
    search_box.send_keys("Selenium Student")

    driver.find_element(By.ID, "student-search-btn").click()

    wait_for_page_text(driver, "Selenium Student")

    assert "Selenium Student" in driver.page_source


def test_08_add_course(driver):
    driver.get(BASE_URL + "/courses")

    driver.find_element(By.ID, "course-title").send_keys("Selenium Automation")
    driver.find_element(By.ID, "course-code").send_keys("SEL-101")
    driver.find_element(By.ID, "course-instructor").send_keys("Sir Automation")
    driver.find_element(By.ID, "add-course-btn").click()

    wait_for_page_text(driver, "Course added successfully")
    wait_for_page_text(driver, "Selenium Automation")

    assert "Course added successfully" in driver.page_source
    assert "Selenium Automation" in driver.page_source


def test_09_search_course(driver):
    driver.get(BASE_URL + "/courses")

    search_box = wait_for_element(driver, By.ID, "course-search")
    search_box.clear()
    search_box.send_keys("Selenium Automation")

    driver.find_element(By.ID, "course-search-btn").click()

    wait_for_page_text(driver, "Selenium Automation")

    assert "Selenium Automation" in driver.page_source


def test_10_add_assignment(driver):
    driver.get(BASE_URL + "/assignments")

    driver.find_element(By.ID, "assignment-title").send_keys("Selenium Final Report")

    course_dropdown = Select(driver.find_element(By.ID, "assignment-course"))
    course_dropdown.select_by_index(0)

    driver.find_element(By.ID, "assignment-date").send_keys("05/25/2026")

    priority_dropdown = Select(driver.find_element(By.ID, "assignment-priority"))
    priority_dropdown.select_by_value("High")

    status_dropdown = Select(driver.find_element(By.ID, "assignment-status"))
    status_dropdown.select_by_value("Pending")

    driver.find_element(By.ID, "add-assignment-btn").click()

    wait_for_page_text(driver, "Assignment added successfully")
    wait_for_page_text(driver, "Selenium Final Report")

    assert "Assignment added successfully" in driver.page_source
    assert "Selenium Final Report" in driver.page_source


def test_11_search_assignment(driver):
    driver.get(BASE_URL + "/assignments")

    search_box = wait_for_element(driver, By.ID, "assignment-search")
    search_box.clear()
    search_box.send_keys("Selenium Final Report")

    driver.find_element(By.ID, "filter-btn").click()

    wait_for_page_text(driver, "Selenium Final Report")

    assert "Selenium Final Report" in driver.page_source


def test_12_filter_pending_assignments(driver):
    driver.get(BASE_URL + "/assignments")

    status_dropdown = Select(wait_for_element(driver, By.ID, "status-filter"))
    status_dropdown.select_by_value("Pending")

    driver.find_element(By.ID, "filter-btn").click()

    wait_for_element(driver, By.ID, "assignments-table")
    wait_for_page_text(driver, "Pending")

    assert "Pending" in driver.page_source


def test_13_filter_high_priority_assignments(driver):
    driver.get(BASE_URL + "/assignments")

    priority_dropdown = Select(wait_for_element(driver, By.ID, "priority-filter"))
    priority_dropdown.select_by_value("High")

    driver.find_element(By.ID, "filter-btn").click()

    wait_for_element(driver, By.ID, "assignments-table")
    wait_for_page_text(driver, "High")

    assert "High" in driver.page_source


def test_14_update_assignment_status(driver):
    driver.get(BASE_URL + "/assignments")

    update_buttons = driver.find_elements(By.CLASS_NAME, "update-btn")

    assert len(update_buttons) > 0

    update_buttons[0].click()

    wait_for_page_text(driver, "Assignment status updated successfully")

    assert "Assignment status updated successfully" in driver.page_source


def test_15_health_route(driver):
    driver.get(BASE_URL + "/health")

    assert "Application is healthy and running" in driver.page_source