/* eslint-disable camelcase */
import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import URI from 'urijs';
import SearchBar from 'foremanReact/components/SearchBar';
import Pagination from 'foremanReact/components/Pagination';
import { get } from 'foremanReact/redux/API';
import { Grid, GridItem } from '@patternfly/react-core';
import {
  selectAPIStatus,
  selectAPIResponse,
} from 'foremanReact/redux/API/APISelectors';
import { useForemanSettings } from 'foremanReact/Root/Context/ForemanContext';
import { HOST_REPORTS_SEARCH_PROPS } from '../../Router/HostReports/IndexPage/constants';
import ReportsTable from './ReportsTable';

const ReportsTab = ({ hostName }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const API_KEY = `get-reports-${hostName}`;
  const { reports, itemCount } = useSelector(state =>
    selectAPIResponse(state, API_KEY)
  );
  const { perPage: settingsPerPage = 20 } = useForemanSettings() || {};
  const status = useSelector(state => selectAPIStatus(state, API_KEY));
  const fetchReports = useCallback(
    ({ search: searchParam, per_page: perPageParam, page: pageParam } = {}) => {
      const {
        page: urlPage,
        perPage: urlPerPage,
        search: urlSearch,
      } = getUrlParams();
      const search = searchParam !== undefined ? searchParam : urlSearch;
      const page = pageParam || urlPage;
      const per_page = perPageParam || urlPerPage;
      dispatch(
        get({
          key: API_KEY,
          url: '/host_reports',
          params: {
            page,
            per_page,
            search: getServerQuery(search),
          },
        })
      );
      updateUrl({ page, per_page, search });
    },
    [API_KEY, dispatch, getServerQuery, getUrlParams, updateUrl]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports, history.location]);

  const onPaginationChange = ({ page, per_page }) => {
    const { search } = getUrlParams();
    updateUrl({ page, per_page, search });
  };

  const getServerQuery = useCallback(
    search => {
      const serverQuery = [`host = ${hostName}`];
      if (search) {
        serverQuery.push(`AND (${search})`);
      }
      return serverQuery.join(' ').trim();
    },
    [hostName]
  );

  const getUrlParams = useCallback(() => {
    const params = { page: 1, perPage: settingsPerPage, search: '' };
    const urlSearch = history.location?.search;
    const urlParams = urlSearch && new URLSearchParams(urlSearch);
    if (urlParams) {
      params.search = urlParams.get('search') || params.search;
      params.page = Number(urlParams.get('page')) || params.page;
      params.perPage = Number(urlParams.get('per_page')) || params.perPage;
    }
    return params;
  }, [history.location, settingsPerPage]);

  const updateUrl = useCallback(
    ({ page, per_page, search = '' }) => {
      const uri = new URI();
      uri.search({ page, per_page, search });
      history.push({ search: uri.search() });
    },
    [history]
  );

  return (
    <Grid id="new_host_details_insights_tab" hasGutter>
      <GridItem span={6}>
        <SearchBar
          data={HOST_REPORTS_SEARCH_PROPS}
          onSearch={search => fetchReports({ search, page: 1 })}
        />
      </GridItem>
      <GridItem span={6}>
        <Pagination
          variant="top"
          itemCount={itemCount}
          onChange={onPaginationChange}
        />
      </GridItem>
      <GridItem>
        <ReportsTable
          reports={reports}
          status={status}
          fetchReports={fetchReports}
        />
      </GridItem>
      <GridItem>
        <Pagination
          variant="bottom"
          itemCount={itemCount}
          onChange={onPaginationChange}
        />
      </GridItem>
    </Grid>
  );
};

ReportsTab.propTypes = {
  hostName: PropTypes.string.isRequired,
};

export default ReportsTab;
