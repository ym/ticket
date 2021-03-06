/*global $*/
import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {FormGroup, ControlLabel, FormControl} from 'react-bootstrap'
import AV from 'leancloud-storage/live-query'

const common = require('./common')

export default class NewTicket extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      categories: [],
      apps: [],
      title: localStorage.getItem('ticket:new:title') || '',
      appId: '',
      category: {},
      content: localStorage.getItem('ticket:new:content') || '',
    }
  }

  componentDidMount() {
    Promise.all([
      new AV.Query('Category').find(),
      AV.Cloud.run('getLeanCloudApps'),
    ])
    .then(([categories, apps]) => {
      this.setState({categories, apps})
    })
  }

  handleTitleChange(e) {
    localStorage.setItem('ticket:new:title', e.target.value)
    this.setState({title: e.target.value})
  }

  handleCategoryChange(e) {
    const category = _.find(this.state.categories, {id: e.target.value})
    this.setState({category, content: category.get('qTemplate') || ''})
  }

  handleAppChange(e) {
    this.setState({appId: e.target.value})
  }

  handleContentChange(e) {
    localStorage.setItem('ticket:new:content', e.target.value)
    this.setState({content: e.target.value})
  }

  handleSubmit(e) {
    e.preventDefault()
    if (!this.state.title || this.state.title.trim().length === 0) {
      this.context.addNotification(new Error('标题不能为空'))
      return
    }
    if (!this.state.category || !this.state.category.id) {
      this.context.addNotification(new Error('问题分类不能为空'))
      return
    }
    common.uploadFiles($('#ticketFile')[0].files)
    .then((files) => {
      return new AV.Object('Ticket').save({
        title: this.state.title,
        category: common.getTinyCategoryInfo(this.state.category),
        content: this.state.content,
        files,
      })
      .then((ticket) => {
        if (this.state.appId) {
          return new AV.Object('Tag').save({
            key: 'appId',
            value: this.state.appId,
            ticket
          })
        }
      })
    }).then(() => {
      localStorage.removeItem('ticket:new:title')
      localStorage.removeItem('ticket:new:content')
      this.context.router.push('/tickets')
    })
    .catch(this.context.addNotification)
  }

  render() {
    const options = this.state.categories.map((category) => {
      return (
        <option key={category.id} value={category.id}>{category.get('name')}</option>
      )
    })
    const appOptions = this.state.apps.map((app) => {
      return <option key={app.app_id} value={app.app_id}>{app.app_name}</option>
    })
    return (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <FormGroup>
          <ControlLabel>标题</ControlLabel>
          <input type="text" className="form-control" value={this.state.title} onChange={this.handleTitleChange.bind(this)} />
        </FormGroup>
        <FormGroup>
          <ControlLabel>相关应用</ControlLabel>
          <FormControl componentClass="select" value={this.state.appId} onChange={this.handleAppChange.bind(this)}>
            <option key='empty'></option>
            {appOptions}
          </FormControl>
        </FormGroup>
        <FormGroup>
          <ControlLabel>问题分类</ControlLabel>
          <FormControl componentClass="select" value={this.state.category.id} onChange={this.handleCategoryChange.bind(this)}>
            <option key='empty'></option>
            {options}
          </FormControl>
        </FormGroup>
        <FormGroup>
          <textarea className="form-control" rows="8" placeholder="遇到的问题" value={this.state.content} onChange={this.handleContentChange.bind(this)}></textarea>
        </FormGroup>
        <FormGroup>
          <input id="ticketFile" type="file" multiple />
        </FormGroup>
        <button type="submit" className="btn btn-default">提交</button>
      </form>
    )
  }

}

NewTicket.contextTypes = {
  router: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
}

NewTicket.propTypes = {
}

