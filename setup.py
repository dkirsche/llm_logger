# setup.py
from setuptools import setup, find_packages

setup(
    name='llm_logger',  
    version='0.1.5',  
    author='Dan Kirsche',  
    author_email='dan@agenta.app',  
    description='A package for asynchronously logging llm request/response.',
    long_description=open('README.md').read(),  
    long_description_content_type='text/markdown', 
    url='https://github.com/dkirsche/llm_logger.git',
    packages=find_packages(),
    install_requires=[
        'asyncpg>=0.21.0',  # Ensure you specify appropriate version constraints
        'psycopg2-binary>=2.9.9',
    ],
    classifiers=[
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'License :: OSI Approved :: MIT License',  # Adjust according to your license
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.7',  # Adjust based on your compatibility
)
