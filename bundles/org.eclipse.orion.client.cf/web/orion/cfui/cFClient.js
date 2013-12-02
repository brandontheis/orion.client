/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define*/
define(['require', 'orion/xhr', 'orion/Deferred', 'orion/operation'], function(require, xhr, Deferred, operation) {

	var eclipse = eclipse || {};
	
	eclipse.CFService = (function(){
		
		var contentType = "application/json; charset=UTF-8";
		
		/**
		 * Creates a new CF service.
		 * 
		 * @class Provides operations for interacting with Cloud Foundry
		 * @name org.eclipse.orion.client.cf.CFService
		 */
		function CFService(serviceRegistry) {
			if (serviceRegistry) {
				this._serviceRegistry = serviceRegistry;
				this._serviceRegistration = serviceRegistry.registerService(
						"orion.cf.service", this);
			}
		}
	
		CFService.prototype = /** @lends org.eclipse.orion.client.cf.CFService.prototype */
		{	
			_getServiceResponse : function(deferred, result) {
				var response = result.response ? JSON.parse(result.response) : null;

				if (result.xhr && result.xhr.status === 202) {
					var def = operation.handle(response.Location);
					def.then(function(data) {
						try {
							deferred.resolve(JSON.parse(data));
						} catch (e) {
							deferred.resolve(data);
						}
					}, function(data) {
						data.failedOperation = response.Location;
						deferred.reject(data);
					}, deferred.progress);
					deferred.then(null, function(error) {
						def.reject(error);
					});
					return;
				}
				deferred.resolve(response);
				return;
			},
				
			_handleServiceResponseError: function(deferred, error){
				deferred.reject(error);
			},

			_xhrV1 : function(method, url, data) {
				var self = this;
				var clientDeferred = new Deferred();

				xhr(method, url, { headers : { "CF-Version" : "1",
				"Content-Type" : contentType
				},
				timeout : 15000,
				handleAs : "json",
				data : JSON.stringify(data)
				}).then(function(result) {
					self._getServiceResponse(clientDeferred, result);
				}, function(error) {
					self._handleServiceResponseError(clientDeferred, error);
				});

				return clientDeferred;
			},
		
			// Target CF v2 operations
			
			setTarget: function(url, org, space) {
				return this._xhrV1("POST", require.toUrl("cfapi/target"), {
					'Url': url,
					'Org': org, 
					'Space': space
				});
			},
			
			login: function(url, username, password, org, space) {
				return this._xhrV1("POST", require.toUrl("cfapi/target"), {
					'Url': url, 
					'Username': username, 
					'Password': password, 
					'Org': org, 
					'Space': space
				});
			},
			
			logout: function() {
				return this._xhrV1("DELETE", require.toUrl("cfapi/target"));
			},
			
			getTarget: function() {
				return this._xhrV1("GET", require.toUrl("cfapi/target"));
			},

			getInfo: function() {
				return this._xhrV1("GET", require.toUrl("cfapi/info"));
			},
			
			// Apps CF v2 operations
			
			pushApp: function(appName, dir) {
				return this._xhrV1("POST", require.toUrl("cfapi/apps"), {
					App: appName, 
					Location: dir
				});
			},
			
			getApp: function(appName, dir) {
				var url = require.toUrl("cfapi/apps/");
				if (appName) {
					url += "/" + appName;
				}
				if (dir) {
					url += "?location=" + dir;
				}
				return this._xhrV1("GET", url);
			},
			
			getApps: function() {
				return this._xhrV1("GET", require.toUrl("cfapi/apps"));
			},
			
			startApp: function(appName, dir) {
				return this._xhrV1("POST", require.toUrl("cfapi/apps"), {
					App: appName, 
					Location: dir
				});
			},
			
			stopApp: function(appName, dir) {
				return this._xhrV1("POST", require.toUrl("cfapi/apps"), {
					App: appName, 
					Location: dir
				});
			},
			
			deleteApp: function(appName, dir) {
				return this._xhrV1("DELETE", require.toUrl("cfapi/apps"), {
					App: appName, 
					Location: dir
				});
			}
		};
		
		return CFService;
	}());
	
	return eclipse;
});